/**
 * Nearby businesses from Google Places (a real source). OFF unless GRADER_COMPETITORS=on,
 * because Places calls can bill past Google's free monthly allowance.
 */
export type Competitor = { name: string; website: string | null; rating: number | null; reviews: number | null; mapsUrl: string | null };

export function competitorsEnabled() {
  return process.env.GRADER_COMPETITORS?.trim().toLowerCase() === 'on' && Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());
}

export async function findCompetitors(input: { tradeLabel: string; city: string; ownDomain: string }) {
  if (!competitorsEnabled()) return { status: 'off' as const, source: null, competitors: [] as Competitor[] };
  const query = `${input.tradeLabel} in ${input.city}`.replace(/[^\p{L}\p{N}\s&'.,/-]/gu, ' ').slice(0, 100);
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!.trim(),
        'X-Goog-FieldMask': 'places.displayName,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri',
      },
      body: JSON.stringify({ textQuery: query, pageSize: 6 }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return { status: 'error' as const, source: null, competitors: [] as Competitor[] };
    const payload = (await response.json()) as {
      places?: Array<{ displayName?: { text?: string }; websiteUri?: string; rating?: number; userRatingCount?: number; googleMapsUri?: string }>;
    };
    const competitors = (payload.places || [])
      .map((place) => ({
        name: place.displayName?.text || '',
        website: place.websiteUri || null,
        rating: typeof place.rating === 'number' ? place.rating : null,
        reviews: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
        mapsUrl: place.googleMapsUri || null,
      }))
      .filter((place) => place.name && !(place.website && place.website.includes(input.ownDomain)))
      .slice(0, 5);
    return {
      status: 'done' as const,
      source: `Google Places text search for “${query}” on ${new Date().toUTCString()}`,
      competitors,
    };
  } catch {
    return { status: 'error' as const, source: null, competitors: [] as Competitor[] };
  }
}
