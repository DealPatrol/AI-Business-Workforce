import { NextRequest, NextResponse } from 'next/server';
import {
  assertRecipientOwned,
  parseJsonBody,
  requireCampaignOwner,
} from '@/lib/imagery/auth';
import {
  buildSatelliteStaticUrl,
  buildStreetViewStaticUrl,
  fetchStreetViewMetadata,
  formatRecipientAddressLine,
  geocodeAddress,
  isGoogleMapsConfigured,
} from '@/lib/google/streetview';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Internal operator preview: geocode + SV metadata + short-lived static URL.
 * Persists geo/pano params only. NEVER marks Street View as print_source or AI input.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;

  if (!isGoogleMapsConfigured()) {
    return NextResponse.json(
      {
        error:
          'GOOGLE_MAPS_API_KEY is not configured. Street View preview stays offline until Cole adds a restricted Maps key.',
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

    const previewUrl = metadata.available
      ? buildStreetViewStaticUrl({
          lat: metadata.lat ?? geo.lat,
          lng: metadata.lng ?? geo.lng,
          panoId: metadata.panoId,
          heading,
          pitch,
          fov,
        })
      : buildSatelliteStaticUrl(geo.lat, geo.lng);

    const { error: updateError } = await auth.ctx.admin
      .from('campaign_recipients')
      .update({
        latitude: geo.lat,
        longitude: geo.lng,
        normalized_address: geo.normalizedAddress,
        street_view_available: metadata.available,
        street_view_pano_id: metadata.panoId,
        street_view_heading: heading ?? null,
        street_view_pitch: pitch,
        street_view_fov: fov,
        street_view_captured_at: metadata.date,
        imagery_provider: metadata.available ? 'google_street_view' : 'google_satellite',
        imagery_fetched_at: new Date().toISOString(),
        imagery_status: metadata.available ? 'needs_photo' : 'needs_photo',
        imagery_error: metadata.available
          ? null
          : `Street View status ${metadata.status}; satellite preview only. Upload a crew_photo for printable Current.`,
      })
      .eq('id', recipient.id);

    if (updateError) {
      console.error('streetview-preview update failed', updateError);
      return NextResponse.json(
        { error: 'Could not save Street View reference params.' },
        { status: 500 },
      );
    }

    // Also document campaign-level geo when empty (parity with live columns).
    await auth.ctx.admin
      .from('campaigns')
      .update({
        latitude: geo.lat,
        longitude: geo.lng,
        normalized_address: geo.normalizedAddress,
        street_view_available: metadata.available,
        imagery_provider: metadata.available ? 'google_street_view' : 'google_satellite',
        imagery_fetched_at: new Date().toISOString(),
      })
      .eq('id', recipient.campaign_id)
      .is('latitude', null);

    return NextResponse.json({
      ok: true,
      usage: 'internal_reference',
      warning:
        'Street View / satellite preview is INTERNAL ONLY. Do not print it, store it as Current, or feed it into After AI edits. Upload crew_photo or owner_upload for printable Current.',
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
      // Short-lived API URL for operator UI; Cache-Control private on clients.
      previewUrl,
      previewKind: metadata.available ? 'street_view' : 'satellite',
      imageryStatus: 'needs_photo',
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
