import { NextRequest, NextResponse } from 'next/server';
import { clientIp } from '@/lib/analytics/request-context';
import { extractSiteProfile, profileLinks, servicesDraft } from '@/lib/ava/onboarding/site-profile';
import { fetchPublicHtml } from '@/lib/prospector/safe-fetch';
import { PublicFetchError } from '@/lib/prospector/errors';
import { createRateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const takeScan = createRateLimiter(6, 10 * 60_000);

/**
 * Self-serve onboarding: read the owner's website (home page plus up to 2 services/about/contact pages)
 * and return a draft profile for the onboarding form. Public pages only (SSRF-guarded fetch), nothing stored.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers.get('x-forwarded-for')) || 'unknown';
  const limit = takeScan(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many website scans. Try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }
  let raw = '';
  try {
    const body = (await request.json()) as { url?: unknown };
    raw = typeof body.url === 'string' ? body.url.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Send a website address.' }, { status: 400 });
  }
  if (!raw || raw.length > 300) return NextResponse.json({ error: 'Send a website address.' }, { status: 400 });
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const home = await fetchPublicHtml(url);
    let profile = extractSiteProfile(home.html, home.finalUrl);
    for (const link of profileLinks(home.html, home.finalUrl, 2)) {
      try {
        const page = await fetchPublicHtml(link);
        profile = extractSiteProfile(page.html, page.finalUrl, profile);
      } catch {
        // a sub-page failing is fine; keep what the home page gave us
      }
    }
    return NextResponse.json({ profile, servicesDraft: servicesDraft(profile) });
  } catch (error) {
    const message = error instanceof PublicFetchError ? error.message : 'Could not read that website.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
