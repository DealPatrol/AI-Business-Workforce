export const PLACES_PAGE_SIZE = 10;
export const PLACES_MAX_PAGES = 2;
export const PLACES_MAX_QUERIES = 6;
export const PLACES_MAX_RADIUS_METERS = 50_000;
export const DEFAULT_DAILY_CAP = 25;
export const DEFAULT_SEND_SPACING_SECONDS = 90;
export const MIN_SEND_SPACING_SECONDS = 30;
export const MAX_SEND_SPACING_SECONDS = 3600;
export const MAX_DAILY_CAP = 200;
export const ENRICH_BATCH_SIZE = 5;
export const ENRICH_CONCURRENCY = 2;

export type PlacesEstimate = {
  queries: number;
  maxPages: number;
  pageSize: number;
  maxRequests: number;
  maxResults: number;
};

export function placesSearchEstimate(queryCount: number): PlacesEstimate {
  const queries = Math.max(0, Math.min(queryCount, PLACES_MAX_QUERIES));
  return {
    queries,
    maxPages: PLACES_MAX_PAGES,
    pageSize: PLACES_PAGE_SIZE,
    maxRequests: queries * PLACES_MAX_PAGES,
    maxResults: queries * PLACES_MAX_PAGES * PLACES_PAGE_SIZE,
  };
}

export function milesToMeters(miles: number): number {
  return Math.min(PLACES_MAX_RADIUS_METERS, Math.round(miles * 1609.344));
}

export function metersToMiles(meters: number): number {
  return Math.round((meters / 1609.344) * 10) / 10;
}
