import { NextRequest, NextResponse } from 'next/server';
import {
  assertRecipientOwned,
  imageryBucket,
  parseJsonBody,
  requireCampaignOwner,
} from '@/lib/imagery/auth';
import {
  downloadStreetViewImage,
  fetchStreetViewMetadata,
  formatRecipientAddressLine,
  geocodeAddress,
  isGoogleMapsConfigured,
  normalizeStreetViewCaptureDate,
} from '@/lib/google/streetview';
import { streetViewStorageEnabled } from '@/lib/mail/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Stream a fresh authenticated Street View preview without caching image bytes.
 * Only pano/geo metadata is retained by default.
 */
export async function GET(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;
  const owned = await assertRecipientOwned(
    auth.ctx,
    request.nextUrl.searchParams.get('recipientId') ?? '',
  );
  if (!owned.ok) return owned.response;
  const recipient = owned.recipient;
  if (!recipient.street_view_pano_id || recipient.latitude == null || recipient.longitude == null) {
    return NextResponse.json({ error: 'Street View imagery has not been fetched.' }, { status: 404 });
  }

  try {
    const image = await downloadStreetViewImage({
      lat: recipient.latitude,
      lng: recipient.longitude,
      panoId: recipient.street_view_pano_id,
      heading: recipient.street_view_heading ?? undefined,
      pitch: recipient.street_view_pitch ?? undefined,
      fov: recipient.street_view_fov ?? undefined,
      size: '640x640',
    });
    return new NextResponse(new Uint8Array(image.bytes), {
      headers: {
        'Content-Type': image.mimeType,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Street View preview failed.' },
      { status: 502 },
    );
  }
}

/**
 * Geocode + metadata lookup. Image storage is disabled by default because
 * Google generally prohibits storing Street View Static content. Operators
 * with separate written rights can explicitly opt in.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;

  if (!isGoogleMapsConfigured()) {
    return NextResponse.json(
      {
        error:
          'GOOGLE_MAPS_API_KEY is not configured. Street View Current fetch stays offline until Cole adds a restricted Maps key.',
        configured: false,
      },
      { status: 503 },
    );
  }

  try {
    const body = await parseJsonBody(request);
    const recipientId = String(body.recipientId ?? '').trim();
    const owned = await assertRecipientOwned(auth.ctx, recipientId);
    if (!owned.ok) return owned.response;

    const recipient = owned.recipient;
    const address =
      String(body.address ?? '').trim() ||
      formatRecipientAddressLine(recipient);

    await auth.ctx.admin
      .from('campaign_recipients')
      .update({ imagery_status: 'geocoding', imagery_error: null })
      .eq('id', recipient.id);

    const geo = await geocodeAddress(address);
    const metadata = await fetchStreetViewMetadata(geo.lat, geo.lng);

    const heading =
      body.heading != null && Number.isFinite(Number(body.heading))
        ? Number(body.heading)
        : undefined;
    const pitch =
      body.pitch != null && Number.isFinite(Number(body.pitch))
        ? Number(body.pitch)
        : 0;
    const fov =
      body.fov != null && Number.isFinite(Number(body.fov))
        ? Number(body.fov)
        : 90;

    let currentImageUrl: string | null = null;
    let storagePath: string | null = null;
    let previewUrl: string;
    let imageryStatus: string;
    let imageryError: string | null = null;

    if (metadata.available && streetViewStorageEnabled()) {
      const downloaded = await downloadStreetViewImage({
        lat: metadata.lat ?? geo.lat,
        lng: metadata.lng ?? geo.lng,
        panoId: metadata.panoId,
        heading,
        pitch,
        fov,
        size: '640x640',
      });

      const ext = downloaded.mimeType.includes('png')
        ? 'png'
        : downloaded.mimeType.includes('webp')
          ? 'webp'
          : 'jpg';
      const bucket = imageryBucket();
      storagePath = `${recipient.id}/current-streetview-${Date.now()}.${ext}`;

      const { error: uploadError } = await auth.ctx.admin.storage
        .from(bucket)
        .upload(storagePath, downloaded.bytes, {
          contentType: downloaded.mimeType,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(
          `Storage upload failed (${uploadError.message}). Ensure bucket "${bucket}" exists (private).`,
        );
      }

      const { data: signed, error: signError } = await auth.ctx.admin.storage
        .from(bucket)
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

      if (signError || !signed?.signedUrl) {
        throw new Error('Street View upload succeeded but signed URL creation failed.');
      }

      currentImageUrl = signed.signedUrl;
      previewUrl = signed.signedUrl;
      imageryStatus = 'ready';
    } else if (metadata.available) {
      previewUrl = `/api/imagery/streetview-preview?recipientId=${encodeURIComponent(recipient.id)}`;
      imageryStatus = 'ready';
      imageryError =
        'Preview is fetched on demand; Google Street View storage and postcard use are disabled by default.';
    } else {
      previewUrl = '';
      imageryStatus = 'needs_photo';
      imageryError = `Street View status ${metadata.status}. Upload an owner/crew photo or retry later.`;
    }

    const patch: Record<string, unknown> = {
      latitude: geo.lat,
      longitude: geo.lng,
      normalized_address: geo.normalizedAddress,
      street_view_available: metadata.available,
      street_view_pano_id: metadata.panoId,
      street_view_heading: heading ?? null,
      street_view_pitch: pitch,
      street_view_fov: fov,
      // Column is `date`; SV metadata is "YYYY-MM" → stored as "YYYY-MM-01" (month precision).
      street_view_captured_at: normalizeStreetViewCaptureDate(metadata.date),
      imagery_provider: metadata.available ? 'google_street_view' : null,
      imagery_fetched_at: new Date().toISOString(),
      imagery_status: imageryStatus,
      imagery_error: imageryError,
    };

    if (currentImageUrl) {
      patch.current_image_url = currentImageUrl;
      patch.current_image_source = 'street_view';
      patch.current_image_usage = 'print_source';
      // New Current invalidates prior After until re-rendered + re-reviewed
      patch.after_image_url = null;
      patch.review_status = 'pending';
      patch.postcard_approved_at = null;
    } else if (
      metadata.available &&
      !streetViewStorageEnabled() &&
      recipient.current_image_source === 'street_view'
    ) {
      patch.current_image_url = null;
      patch.current_image_source = null;
      patch.current_image_usage = null;
      patch.after_image_url = null;
      patch.review_status = 'pending';
      patch.postcard_approved_at = null;
    }

    const { error: updateError } = await auth.ctx.admin
      .from('campaign_recipients')
      .update(patch)
      .eq('id', recipient.id);

    if (updateError) {
      console.error('streetview-preview update failed', updateError);
      return NextResponse.json(
        {
          error:
            'Could not save Street View Current. If this is a check-constraint error, apply migration 20260924130000_streetview_printable_current.sql (allows current_image_source=street_view).',
          detail: updateError.message,
        },
        { status: 500 },
      );
    }

    await auth.ctx.admin
      .from('campaigns')
      .update({
        latitude: geo.lat,
        longitude: geo.lng,
        normalized_address: geo.normalizedAddress,
        street_view_available: metadata.available,
        imagery_provider: metadata.available ? 'google_street_view' : null,
        imagery_fetched_at: new Date().toISOString(),
      })
      .eq('id', recipient.campaign_id)
      .is('latitude', null);

    return NextResponse.json({
      ok: true,
      usage: metadata.available ? 'print_source' : 'operator_preview',
      note: metadata.available
        ? currentImageUrl
          ? 'Street View storage is explicitly enabled. Human review and postcard policy gates still apply.'
          : 'Street View is available and shown on demand without caching. Upload an owner/crew photo for postcard use.'
        : 'Street View unavailable. Use an owner/crew photo as the alternate Current.',
      geocode: {
        lat: geo.lat,
        lng: geo.lng,
        normalizedAddress: geo.normalizedAddress,
      },
      streetView: {
        available: metadata.available,
        status: metadata.status,
        panoId: metadata.panoId,
        date: metadata.date,
      },
      previewUrl,
      previewKind: metadata.available ? 'street_view' : 'none',
      currentImageUrl,
      currentImageSource: currentImageUrl ? 'street_view' : null,
      currentImageUsage: currentImageUrl ? 'print_source' : 'preview_only',
      storagePath,
      imageryStatus,
    });
  } catch (error) {
    console.error('streetview-preview error', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Street View preview failed.',
      },
      { status: 502 },
    );
  }
}
