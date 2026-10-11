import { PLACES_MAX_PAGES, PLACES_PAGE_SIZE } from '@/lib/prospector/constants';
import { PlacesError, ProspectorSetupError } from '@/lib/prospector/errors';
import {
  composeTextQuery,
  dedupePlaces,
  parsePlacesResponse,
  type PlaceLead,
} from '@/lib/prospector/places';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.types',
  'places.primaryTypeDisplayName',
  'nextPageToken',
].join(',');

function mapsKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    throw new ProspectorSetupError(
      'Google Maps is not configured. Add GOOGLE_MAPS_API_KEY on the server and enable Places API (New) plus Geocoding. No search was sent.',
    );
  }
  return key;
}

function scrub(message: string): string {
  return message.replace(/key=[^&\s]+/gi, 'key=redacted').slice(0, 400);
}

async function geocode(location: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', location);
  url.searchParams.set('key', apiKey);
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  } catch {
    throw new PlacesError('Google geocoding could not be reached.', 502);
  }
  const payload = (await response.json().catch(() => null)) as {
    results?: Array<{ geometry?: { location?: { lat?: unknown; lng?: unknown } } }>;
    error_message?: string;
  } | null;
  const point = payload?.results?.[0]?.geometry?.location;
  if (typeof point?.lat === 'number' && typeof point.lng === 'number') {
    return { lat: point.lat, lng: point.lng };
  }
  return null;
}

async function searchPage(input: {
  apiKey: string;
  textQuery: string;
  pageToken?: string;
  location?: { lat: number; lng: number } | null;
  radiusMeters?: number | null;
}): Promise<{ places: PlaceLead[]; nextPageToken: string | null }> {
  const body: Record<string, unknown> = {
    textQuery: input.textQuery,
    pageSize: PLACES_PAGE_SIZE,
  };
  if (input.pageToken) body.pageToken = input.pageToken;
  if (input.location && input.radiusMeters) {
    body.locationBias = {
      circle: {
        center: { latitude: input.location.lat, longitude: input.location.lng },
        radius: input.radiusMeters,
      },
    };
  }
  let response: Response;
  try {
    response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': input.apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new PlacesError('Google Places could not be reached.', 502);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const record = payload as { error?: { message?: string; status?: string } };
    const message = scrub(record.error?.message || `Places search failed (${response.status}).`);
    throw new PlacesError(message, response.status);
  }
  return parsePlacesResponse(payload);
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function searchGooglePlaces(input: {
  queries: string[];
  location: string;
  radiusMeters: number | null;
}): Promise<{ places: Array<PlaceLead & { searchQuery: string }>; warnings: string[] }> {
  const apiKey = mapsKey();
  const warnings: string[] = [];
  let locationPoint: { lat: number; lng: number } | null = null;
  if (input.location.trim() && input.radiusMeters) {
    locationPoint = await geocode(input.location, apiKey);
    if (!locationPoint) {
      warnings.push('Could not geocode that location, so the search used the city name without a radius bias.');
    }
  }

  const found: Array<PlaceLead & { searchQuery: string }> = [];
  for (const query of input.queries) {
    const textQuery = composeTextQuery(query, input.location);
    let pageToken: string | null = null;
    for (let page = 0; page < PLACES_MAX_PAGES; page += 1) {
      if (page > 0) await pause(1_000);
      try {
        const result = await searchPage({
          apiKey,
          textQuery,
          pageToken: pageToken || undefined,
          location: locationPoint,
          radiusMeters: input.radiusMeters,
        });
        for (const place of result.places) found.push({ ...place, searchQuery: query });
        pageToken = result.nextPageToken;
        if (!pageToken) break;
      } catch (error) {
        if (error instanceof PlacesError && (error.status === 403 || error.status === 401)) {
          throw error;
        }
        warnings.push(error instanceof Error ? error.message : `Search failed for ${query}.`);
        break;
      }
    }
    await pause(400);
  }

  const seen = new Set<string>();
  const unique: Array<PlaceLead & { searchQuery: string }> = [];
  for (const place of dedupePlaces(found)) {
    if (seen.has(place.placeId)) continue;
    seen.add(place.placeId);
    const match = found.find((item) => item.placeId === place.placeId);
    unique.push({ ...place, searchQuery: match?.searchQuery || '' });
  }
  return { places: unique, warnings };
}
