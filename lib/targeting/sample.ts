import type { Parcel } from './types';

/**
 * Deterministic SAMPLE parcels (fake addresses) used when REGRID_API_TOKEN is
 * not set, so the campaign builder can be demoed without spending money.
 */
export function sampleParcels(opts: { zip?: string; lat?: number; lng?: number; count?: number }): Parcel[] {
  const zip = opts.zip || '35077';
  const baseLat = opts.lat ?? 34.0687;
  const baseLng = opts.lng ?? -86.7672;
  const streets = ['Oak Hollow Dr', 'County Road 747', 'Magnolia Ln', 'Ridgecrest Ave', 'Pine Bluff Rd', 'Cedar Creek Ct'];
  let seed = Number(zip.replace(/\D/g, '')) || 35077;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const out: Parcel[] = [];
  const n = opts.count ?? 60;
  for (let i = 0; i < n; i++) {
    const owner = rand() > 0.28;
    const soldMonthsAgo = Math.floor(rand() * 120);
    const sale = new Date();
    sale.setMonth(sale.getMonth() - soldMonthsAgo);
    out.push({
      id: `sample-${zip}-${i}`,
      address: `${100 + Math.floor(rand() * 9800)} ${streets[i % streets.length]}`,
      city: 'Sample City',
      state: 'AL',
      zip,
      lat: baseLat + (rand() - 0.5) * 0.06,
      lng: baseLng + (rand() - 0.5) * 0.06,
      yearBuilt: 1960 + Math.floor(rand() * 64),
      lotAcres: Math.round((0.12 + rand() * 1.6) * 100) / 100,
      ownerOccupied: owner,
      lastSaleDate: sale.toISOString().slice(0, 10),
      recentPermit: rand() > 0.85,
    });
  }
  return out;
}
