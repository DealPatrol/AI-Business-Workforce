import type { Parcel, TargetingFilters } from './types';

if (typeof window !== 'undefined') throw new Error('lib/targeting/regrid is server-only.');

const BASE = 'https://app.regrid.com/api/v2';

export function isRegridConfigured(): boolean {
  return Boolean(process.env.REGRID_API_TOKEN?.trim());
}

type Feature = { id?: string | number; properties?: { fields?: Record<string, unknown> } };

function str(v: unknown): string {
  return v == null ? '' : String(v);
}
function num(v: unknown): number | null {
  const n = Number(v);
  return v == null || v === '' || !Number.isFinite(n) ? null : n;
}
function norm(v: unknown): string {
  return str(v).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Map a Regrid parcel feature to our Parcel. Owner-occupied = mailing address matches site address. */
export function mapRegridFeature(f: Feature): Parcel {
  const p = f.properties?.fields ?? {};
  const site = norm(p.address);
  const mail = norm(p.mailadd);
  return {
    id: str(p.ll_uuid || f.id),
    address: str(p.address),
    city: str(p.scity),
    state: str(p.state2),
    zip: str(p.szip5 || p.szip),
    lat: num(p.lat),
    lng: num(p.lon),
    yearBuilt: num(p.yearbuilt),
    lotAcres: num(p.ll_gisacre ?? p.gisacre),
    ownerOccupied: site && mail ? site === mail : null,
    lastSaleDate: str(p.saledate) || null,
  };
}

/**
 * Fetch parcels by ZIP (query endpoint) or point+radius (point endpoint).
 * Each returned record counts against the Regrid plan's record allowance.
 */
export async function fetchRegridParcels(f: TargetingFilters): Promise<Parcel[]> {
  const token = process.env.REGRID_API_TOKEN?.trim();
  if (!token) throw new Error('REGRID_API_TOKEN is not configured.');
  const limit = Math.min(Math.max(f.limit ?? 200, 1), 1000);
  const params = new URLSearchParams({ token, limit: String(limit), return_geometry: 'false' });
  let url: string;
  if (f.lat != null && f.lng != null) {
    params.set('lat', String(f.lat));
    params.set('lon', String(f.lng));
    params.set('radius', String(Math.round((f.radiusMiles ?? 0.5) * 1609.34)));
    url = `${BASE}/parcels/point?${params}`;
  } else if (f.zip) {
    params.set('fields[szip5][eq]', f.zip);
    url = `${BASE}/parcels/query?${params}`;
  } else {
    throw new Error('Provide a ZIP or a lat/lng with radius.');
  }
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(25_000) });
  if (!res.ok) throw new Error(`Regrid request failed (HTTP ${res.status}).`);
  const data = (await res.json()) as { parcels?: { features?: Feature[] }; features?: Feature[] };
  const features = data.parcels?.features ?? data.features ?? [];
  return features.map(mapRegridFeature);
}
