export type TargetingFilters = {
  zip?: string;
  lat?: number;
  lng?: number;
  radiusMiles?: number;
  minHomeAge?: number;
  maxHomeAge?: number;
  minLotAcres?: number;
  maxLotAcres?: number;
  ownerOccupiedOnly?: boolean;
  soldWithinMonths?: number;
  excludePermitYears?: number;
  limit?: number;
};

export type Parcel = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  yearBuilt: number | null;
  lotAcres: number | null;
  ownerOccupied: boolean | null;
  lastSaleDate: string | null;
  recentPermit?: boolean;
};
