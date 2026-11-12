import { NextRequest, NextResponse } from 'next/server';
import { isKnownCrawlerUserAgent } from '@/lib/checkout-guard';
import { isAvaPlanKey } from '@/lib/ava/pricing';
import { startAvaPlanCheckout } from '@/lib/ava/plan-checkout';

export const dynamic = 'force-dynamic';

/**
 * Shareable buy links: /buy/starter, /buy/growth, /buy/pro, /buy/elite.
 * Each visit starts a fresh Stripe Checkout Session (Starter shows $1 today) and redirects to it.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ plan: string }> }) {
  const { plan } = await params;
  const planKey = String(plan || '').toLowerCase();
  if (!isAvaPlanKey(planKey)) return NextResponse.redirect(new URL('/pricing#plans', req.url), 307);
  if (isKnownCrawlerUserAgent(req.headers.get('user-agent'))) {
    return NextResponse.redirect(new URL('/pricing#plans', req.url), 307);
  }
  const result = await startAvaPlanCheckout({ origin: req.nextUrl.origin, planKey });
  if ('error' in result) return NextResponse.redirect(new URL('/pricing?checkout=unavailable#plans', req.url), 307);
  const response = NextResponse.redirect(result.url, 303);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex');
  return response;
}
