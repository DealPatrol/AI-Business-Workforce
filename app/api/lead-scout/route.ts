import { NextResponse } from 'next/server';
import { clientIp } from '@/lib/analytics/request-context';
import { takeLeadScoutSearch } from '@/lib/lead-scout/limiter';
import { readLeadScoutQuery } from '@/lib/lead-scout/input';
import { PlacesError, ProspectorSetupError } from '@/lib/prospector/errors';
import { searchGooglePlaces } from '@/lib/prospector/google-places';

export async function POST(request: Request) {
  const ip = clientIp(request.headers.get('x-forwarded-for')) || 'unknown';
  const limit = takeLeadScoutSearch(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many searches from this network. Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const body = (await request.json().catch(() => null)) as { trade?: unknown; city?: unknown } | null;
  const query = readLeadScoutQuery({ trade: body?.trade, city: body?.city });
  if (!query.ok) return NextResponse.json({ error: query.error }, { status: 400 });

  try {
    const result = await searchGooglePlaces({
      queries: [query.trade],
      location: query.city,
      radiusMeters: null,
    });
    const places = result.places.slice(0, 10).map((place) => ({
      name: place.name,
      category: place.category,
      address: place.address,
      phone: place.phone,
      website: place.website,
      rating: place.rating,
      reviewCount: place.reviewCount,
      mapsUrl: place.mapsUrl,
    }));
    return NextResponse.json({
      places,
      warnings: result.warnings,
      note: 'These are public Google listings. Lead Scout did not email, text, or call them.',
    });
  } catch (error) {
    if (error instanceof ProspectorSetupError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof PlacesError) {
      return NextResponse.json({ error: error.message }, { status: error.status >= 400 ? error.status : 502 });
    }
    console.error('lead scout failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'The search could not be completed.' }, { status: 502 });
  }
}
