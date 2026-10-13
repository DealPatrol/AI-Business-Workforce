import type { Parcel, TargetingFilters } from './types';

export function applyFilters(parcels: Parcel[], f: TargetingFilters, now = new Date()): Parcel[] {
  const year = now.getFullYear();
  return parcels.filter((p) => {
    if (f.minHomeAge != null || f.maxHomeAge != null) {
      if (p.yearBuilt == null) return false;
      const age = year - p.yearBuilt;
      if (f.minHomeAge != null && age < f.minHomeAge) return false;
      if (f.maxHomeAge != null && age > f.maxHomeAge) return false;
    }
    if (f.minLotAcres != null || f.maxLotAcres != null) {
      if (p.lotAcres == null) return false;
      if (f.minLotAcres != null && p.lotAcres < f.minLotAcres) return false;
      if (f.maxLotAcres != null && p.lotAcres > f.maxLotAcres) return false;
    }
    if (f.ownerOccupiedOnly && p.ownerOccupied !== true) return false;
    if (f.soldWithinMonths != null) {
      if (!p.lastSaleDate) return false;
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - f.soldWithinMonths);
      if (new Date(p.lastSaleDate) < cutoff) return false;
    }
    if (p.recentPermit) return false;
    return true;
  });
}

/** Haversine distance in miles. */
export function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
