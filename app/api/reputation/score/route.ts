import { NextRequest, NextResponse } from 'next/server';
import { reviewScore, type ScorePlace } from '@/lib/reputation/score';

export const dynamic = 'force-dynamic';

// Google Places Text Search (rating fields = Enterprise SKU). Google gives a monthly
// free usage cap per SKU; this daily cap keeps the free tool inside it.
const DAILY_CAP = Number(process.env.REVIEW_SCORE_DAILY_CAP || 25);
const usage = { day: '', count: 0, ips: new Map<string, number>() };
const FIELDS = 'places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.primaryTypeDisplayName';

async function search(apiKey: string, textQuery: string, pageSize: number): Promise<ScorePlace[]> {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELDS },
    body: JSON.stringify({ textQuery, pageSize }),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = (await response.json().catch(() => ({}))) as { places?: Record<string, unknown>[] };
  if (!response.ok) throw new Error('Google Places search failed.');
  return (payload.places ?? []).map((place) => ({
    name: String((place.displayName as { text?: string })?.text || ''),
    rating: typeof place.rating === 'number' ? place.rating : null,
    reviews: Number(place.userRatingCount || 0),
    address: String(place.formattedAddress || ''),
    type: String((place.primaryTypeDisplayName as { text?: string })?.text || ''),
  }));
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: 'The score tool is not connected yet.' }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const business = String(body.business || '').trim().slice(0, 120);
  const city = String(body.city || '').trim().slice(0, 80);
  const trade = String(body.trade || '').trim().slice(0, 60);
  if (!business || !city) return NextResponse.json({ error: 'Enter your business name and city.' }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  if (usage.day !== today) Object.assign(usage, { day: today, count: 0, ips: new Map() });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (usage.count >= DAILY_CAP || (usage.ips.get(ip) || 0) >= 3) {
    return NextResponse.json({ error: 'Daily limit reached. Try again tomorrow.' }, { status: 429 });
  }
  usage.count += 1;
  usage.ips.set(ip, (usage.ips.get(ip) || 0) + 1);

  try {
    const [you] = await search(apiKey, `${business} ${city}`, 1);
    if (!you) return NextResponse.json({ error: 'We could not find that business on Google.' }, { status: 404 });
    const category = trade || you.type || 'home services';
    const nearby = (await search(apiKey, `${category} in ${city}`, 10))
      .filter((place) => place.name.toLowerCase() !== you.name.toLowerCase())
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 3);
    return NextResponse.json({ you, competitors: nearby, category, ...reviewScore(you, nearby) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Search failed.' }, { status: 502 });
  }
}
