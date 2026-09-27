import { NextRequest, NextResponse } from 'next/server';
import {
  assertRecipientOwned,
  parseJsonBody,
  requireCampaignOwner,
} from '@/lib/imagery/auth';
import {
  downloadSatelliteImage,
  downloadStreetViewImage,
  fetchStreetViewMetadata,
  formatRecipientAddressLine,
  geocodeAddress,
  isGoogleMapsConfigured,
  normalizeStreetViewCaptureDate,
} from '@/lib/google/streetview';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Authenticated scouting preview only. Google pixels are streamed directly to
 * the operator with no-store headers and never persisted or reused downstream.
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
  if (recipient.latitude == null || recipient.longitude == null) {
    return NextResponse.json({ error: 'Run the scouting lookup first.' }, { status: 404 });
  }

  try {
    const kind = request.nextUrl.searchParams.get('kind');
    const image =
      kind === 'satellite'
        ? await downloadSatelliteImage(recipient.latitude, recipient.longitude)
        : recipient.street_view_pano_id
          ? await downloadStreetViewImage({
              lat: recipient.latitude,
              lng: recipient.longitude,
              panoId: recipient.street_view_pano_id,
              heading: recipient.street_view_heading ?? undefined,
              pitch: recipient.street_view_pitch ?? undefined,
              fov: recipient.street_view_fov ?? undefined,
              size: '640x640',
            })
          : await downloadSatelliteImage(recipient.latitude, recipient.longitude);
    return new NextResponse(new Uint8Array(image.bytes), {
      headers: {
        'Content-Type': image.mimeType,
        'Cache-Control': 'private, no-store, max-age=0',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'X-YardProof-Usage': 'scouting-only',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scouting preview failed.' },
      { status: 502 },
    );
  }
}

/** Geocode and retain only scouting metadata (coordinates and pano ID). */
export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;
  if (!isGoogleMapsConfigured()) {
    return NextResponse.json(
      { error: 'GOOGLE_MAPS_API_KEY is not configured.', configured: false },
      { status: 503 },
    );
  }

  try {
    const body = await parseJsonBody(request);
    const owned = await assertRecipientOwned(
      auth.ctx,
      String(body.recipientId ?? '').trim(),
    );
    if (!owned.ok) return owned.response;
    const recipient = owned.recipient;
    const address =
      String(body.address ?? '').trim() || formatRecipientAddressLine(recipient);
    const geo = await geocodeAddress(address);
    const metadata = await fetchStreetViewMetadata(geo.lat, geo.lng);
    const heading =
      body.heading != null && Number.isFinite(Number(body.heading))
        ? Number(body.heading)
        : null;
    const pitch =
      body.pitch != null && Number.isFinite(Number(body.pitch))
        ? Number(body.pitch)
        : 0;
    const fov =
      body.fov != null && Number.isFinite(Number(body.fov))
        ? Number(body.fov)
        : 90;
    const previewKind = metadata.available ? 'street_view' : 'satellite';
    const previewUrl =
      `/api/imagery/streetview-preview?recipientId=${encodeURIComponent(recipient.id)}` +
      `&kind=${previewKind}`;
    const hasOwnedCurrent = Boolean(recipient.current_image_url);

    const { error: updateError } = await auth.ctx.admin
      .from('campaign_recipients')
      .update({
        latitude: geo.lat,
        longitude: geo.lng,
        normalized_address: geo.normalizedAddress,
        street_view_available: metadata.available,
        street_view_pano_id: metadata.panoId,
        street_view_heading: heading,
        street_view_pitch: pitch,
        street_view_fov: fov,
        street_view_captured_at: normalizeStreetViewCaptureDate(metadata.date),
        imagery_provider: metadata.available ? 'google_street_view' : 'google_satellite',
        imagery_fetched_at: new Date().toISOString(),
        imagery_status: hasOwnedCurrent ? 'ready' : 'needs_photo',
        imagery_error: hasOwnedCurrent
          ? null
          : 'Scouting preview only. Capture or upload a rights-cleared photo.',
      })
      .eq('id', recipient.id);
    if (updateError) {
      return NextResponse.json(
        { error: 'Could not save scouting metadata.', detail: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      usage: 'operator_preview_only',
      note:
        previewKind === 'street_view'
          ? 'Street View is available for on-screen scouting only.'
          : 'Street View is unavailable; showing a satellite scouting preview only.',
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
      previewKind,
      currentImageUrl: null,
      currentImageSource: null,
      currentImageUsage: 'scouting_only',
      imageryStatus: hasOwnedCurrent ? 'ready' : 'needs_photo',
    });
  } catch (error) {
    console.error('scouting preview error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scouting preview failed.' },
      { status: 502 },
    );
  }
}
