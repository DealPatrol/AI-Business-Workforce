/**
 * Google Street View / Geocoding helpers — server only.
 *
 * LOCKED: Street View is INTERNAL REFERENCE ONLY.
 * - Store geo + pano/heading params; do not treat SV bytes as a permanent print asset.
 * - Never mark SV as print_source.
 * - Never feed SV into AI after-edits.
 */

import { createHmac } from 'node:crypto';

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const SV_METADATA_URL = 'https://maps.googleapis.com/maps/api/streetview/metadata';
const SV_STATIC_PATH = '/maps/api/streetview';
const STATIC_MAP_PATH = '/maps/api/staticmap';

export type GeocodeResult = {
  lat: number;
  lng: number;
  normalizedAddress: string;
  placeId: string | null;
};

export type StreetViewMetadata = {
  status: string;
  available: boolean;
  panoId: string | null;
  lat: number | null;
  lng: number | null;
  date: string | null;
};

export type StreetViewStaticParams = {
  lat: number;
  lng: number;
  size?: string;
  heading?: number;
  pitch?: number;
  fov?: number;
  panoId?: string | null;
};

function requireMapsKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    throw new Error('GOOGLE_MAPS_API_KEY is not configured.');
  }
  return key;
}

export function isGoogleMapsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const key = requireMapsKey();
  const url = new URL(GEOCODE_URL);
  url.searchParams.set('address', address);
  url.searchParams.set('key', key);

  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Geocoding HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    status: string;
    results?: Array<{
      formatted_address?: string;
      place_id?: string;
      geometry?: { location?: { lat: number; lng: number } };
    }>;
    error_message?: string;
  };

  if (payload.status !== 'OK' || !payload.results?.[0]?.geometry?.location) {
    throw new Error(
      payload.error_message ||
        `Geocoding failed with status ${payload.status || 'UNKNOWN'}`,
    );
  }

  const top = payload.results[0];
  return {
    lat: top.geometry!.location!.lat,
    lng: top.geometry!.location!.lng,
    normalizedAddress: top.formatted_address ?? address,
    placeId: top.place_id ?? null,
  };
}

export async function fetchStreetViewMetadata(
  lat: number,
  lng: number,
): Promise<StreetViewMetadata> {
  const key = requireMapsKey();
  const url = new URL(SV_METADATA_URL);
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('key', key);

  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Street View metadata HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    status: string;
    pano_id?: string;
    location?: { lat: number; lng: number };
    date?: string;
  };

  const available = payload.status === 'OK';
  return {
    status: payload.status,
    available,
    panoId: available ? payload.pano_id ?? null : null,
    lat: available ? payload.location?.lat ?? lat : null,
    lng: available ? payload.location?.lng ?? lng : null,
    date: available ? payload.date ?? null : null,
  };
}

/** Sign a Google Static Maps / Street View URL path+query when signing secret is set. */
export function signGoogleMapsUrl(pathWithQuery: string): string {
  const secret = process.env.GOOGLE_MAPS_URL_SIGNING_SECRET?.trim();
  if (!secret) return pathWithQuery;

  const decoded = Buffer.from(secret.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const signature = createHmac('sha1', decoded)
    .update(pathWithQuery)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const joiner = pathWithQuery.includes('?') ? '&' : '?';
  return `${pathWithQuery}${joiner}signature=${signature}`;
}

/**
 * Build a Street View Static image URL for short-lived INTERNAL preview / proxy.
 * Do not persist returned pixels as a print asset or AI input.
 */
export function buildStreetViewStaticUrl(params: StreetViewStaticParams): string {
  const key = requireMapsKey();
  const size = params.size ?? '640x640';
  const search = new URLSearchParams();
  search.set('size', size);
  if (params.panoId) {
    search.set('pano', params.panoId);
  } else {
    search.set('location', `${params.lat},${params.lng}`);
  }
  if (params.heading != null) search.set('heading', String(params.heading));
  if (params.pitch != null) search.set('pitch', String(params.pitch));
  search.set('fov', String(params.fov ?? 90));
  search.set('key', key);

  const pathWithQuery = `${SV_STATIC_PATH}?${search.toString()}`;
  return `https://maps.googleapis.com${signGoogleMapsUrl(pathWithQuery)}`;
}

/** Satellite Static Maps URL — also INTERNAL REFERENCE ONLY. */
export function buildSatelliteStaticUrl(lat: number, lng: number, size = '640x640'): string {
  const key = requireMapsKey();
  const search = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: '20',
    size,
    maptype: 'satellite',
    key,
  });
  const pathWithQuery = `${STATIC_MAP_PATH}?${search.toString()}`;
  return `https://maps.googleapis.com${signGoogleMapsUrl(pathWithQuery)}`;
}

export function formatRecipientAddressLine(parts: {
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  postal_code: string;
}): string {
  return [
    parts.address_line_1,
    parts.address_line_2,
    `${parts.city}, ${parts.state} ${parts.postal_code}`,
  ]
    .filter(Boolean)
    .join(', ');
}
