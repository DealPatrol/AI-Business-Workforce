import type { Parcel } from './types';

if (typeof window !== 'undefined') throw new Error('lib/targeting/shovels is server-only.');

export function isShovelsConfigured(): boolean {
  return Boolean(process.env.SHOVELS_API_KEY?.trim());
}

/**
 * Optional: flag parcels in a ZIP that pulled a permit within `years`, so the
 * campaign can skip homes that just had the work done. Uses Shovels permit
 * search by ZIP and matches on normalized street address. Silently no-ops when
 * SHOVELS_API_KEY is absent. Free tier = 500 credits/mo.
 */
export async function markRecentPermits(parcels: Parcel[], zip: string, years: number): Promise<Parcel[]> {
  const key = process.env.SHOVELS_API_KEY?.trim();
  if (!key || !zip || parcels.length === 0) return parcels;
  const from = new Date();
  from.setFullYear(from.getFullYear() - years);
  const params = new URLSearchParams({
    geo_id: zip,
    permit_from: from.toISOString().slice(0, 10),
    permit_to: new Date().toISOString().slice(0, 10),
    property_type: 'residential',
    size: '100',
  });
  const res = await fetch(`https://api.shovels.ai/v2/permits/search?${params}`, {
    headers: { 'X-API-Key': key },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Shovels request failed (HTTP ${res.status}).`);
  const data = (await res.json()) as { items?: Array<Record<string, unknown>> };
  const norm = (s: unknown) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const permitted = new Set(
    (data.items ?? []).map((it) => {
      const a = (it.address ?? {}) as Record<string, unknown>;
      return norm(a.street_no ? `${a.street_no} ${a.street}` : a.address ?? it.address);
    }),
  );
  return parcels.map((p) => ({ ...p, recentPermit: permitted.has(norm(p.address)) }));
}
