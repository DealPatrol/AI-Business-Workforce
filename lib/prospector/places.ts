import { PLACES_MAX_QUERIES } from '@/lib/prospector/constants';

export type PlaceLead = {
  placeId: string;
  name: string;
  category: string;
  types: string[];
  address: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  mapsUrl: string | null;
};

type PlaceRecord = {
  id?: unknown;
  name?: unknown;
  displayName?: { text?: unknown };
  formattedAddress?: unknown;
  nationalPhoneNumber?: unknown;
  websiteUri?: unknown;
  rating?: unknown;
  userRatingCount?: unknown;
  googleMapsUri?: unknown;
  types?: unknown;
  primaryTypeDisplayName?: { text?: unknown };
};

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function placeIdOf(place: PlaceRecord): string | null {
  const id = text(place.id);
  if (id) return id;
  const resource = text(place.name);
  if (resource?.startsWith('places/')) return resource.slice('places/'.length);
  return null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function sanitizeMapsQuery(value: string): string | null {
  const cleaned = value
    .replace(/[^\p{L}\p{N}\s&'.,-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length < 2 || cleaned.length > 80) return null;
  return cleaned;
}

export function queriesFromTargets(
  targets: Array<{ selected: boolean; queries: string[] }>,
): string[] {
  const seen = new Set<string>();
  const queries: string[] = [];
  for (const target of targets) {
    if (!target.selected) continue;
    for (const query of target.queries) {
      const clean = sanitizeMapsQuery(query);
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      queries.push(clean);
      if (queries.length >= PLACES_MAX_QUERIES) return queries;
    }
  }
  return queries;
}

export function composeTextQuery(query: string, location: string): string {
  const place = location.trim();
  if (!place) return query;
  if (query.toLowerCase().includes(place.toLowerCase())) return query;
  return `${query} in ${place}`;
}

export function parsePlacesResponse(payload: unknown): { places: PlaceLead[]; nextPageToken: string | null } {
  if (!payload || typeof payload !== 'object') {
    return { places: [], nextPageToken: null };
  }
  const record = payload as { places?: unknown; nextPageToken?: unknown };
  const rows = Array.isArray(record.places) ? record.places : [];
  const places: PlaceLead[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const place = row as PlaceRecord;
    const placeId = placeIdOf(place);
    const name = text(place.displayName?.text);
    if (!placeId || !name) continue;
    const types = Array.isArray(place.types)
      ? place.types.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
    const website = text(place.websiteUri);
    places.push({
      placeId,
      name,
      category: text(place.primaryTypeDisplayName?.text) || types[0]?.replace(/_/g, ' ') || '',
      types,
      address: text(place.formattedAddress) || '',
      phone: text(place.nationalPhoneNumber),
      website: website && /^https?:\/\//i.test(website) ? website : null,
      rating: numberOrNull(place.rating),
      reviewCount: numberOrNull(place.userRatingCount),
      mapsUrl: text(place.googleMapsUri),
    });
  }
  return { places, nextPageToken: text(record.nextPageToken) };
}

export function dedupePlaces(places: PlaceLead[]): PlaceLead[] {
  const seen = new Set<string>();
  const unique: PlaceLead[] = [];
  for (const place of places) {
    if (seen.has(place.placeId)) continue;
    seen.add(place.placeId);
    unique.push(place);
  }
  return unique;
}
