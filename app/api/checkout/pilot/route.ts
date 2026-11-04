import { track } from '@vercel/analytics/server';
import { NextRequest, NextResponse } from 'next/server';
import { isPilotPlanKey, pilotPriceIdEnvName, type PilotPlanKey } from '@/lib/ava/pilot-pricing';
import { isKnownCrawlerUserAgent } from '@/lib/checkout-guard';
import {
  buildAvaPilotCheckoutParams,
  createStripeCheckoutSession,
  readStripePriceId,
} from '@/lib/stripe-checkout';

export const dynamic = 'force-dynamic';

const PILOT_PAGE = '/receptionist/pilot';

/** Optional pre-created Stripe Price for the tier. Falls back to inline price_data when unset. */
function pilotPriceId(planKey: PilotPlanKey) {
  return readStripePriceId(process.env[pilotPriceIdEnvName(planKey)]);
}

function isFormPost(req: NextRequest) {
  const type = req.headers.get('content-type') || '';
  return type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data');
}

async function readPlan(req: NextRequest) {
  if (isFormPost(req)) {
    const value = (await req.formData()).get('plan');
    return typeof value === 'string' ? value.toLowerCase() : '';
  }
  const body = (await req.json()) as Record<string, unknown>;
  return String(body?.plan || '').toLowerCase();
}

function fail(req: NextRequest, error: string, status: number) {
  if (isFormPost(req)) return NextResponse.redirect(new URL(`${PILOT_PAGE}?checkout=unavailable`, req.url), 303);
  return NextResponse.json({ error }, { status });
}

/** GET must never create a Stripe session (crawlers and link previews). */
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL(PILOT_PAGE, req.url), 307);
}

export async function POST(req: NextRequest) {
  if (isKnownCrawlerUserAgent(req.headers.get('user-agent'))) {
    return NextResponse.json({ error: 'Checkout is not available to crawlers.' }, { status: 403 });
  }

  try {
    const planKey = await readPlan(req);
    if (!isPilotPlanKey(planKey)) return fail(req, 'Invalid pilot plan.', 400);

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      console.error('STRIPE_SECRET_KEY is not set; pilot checkout cannot start.');
      return fail(req, 'Pilot checkout is not connected yet.', 503);
    }

    const params = buildAvaPilotCheckoutParams({
      origin: req.nextUrl.origin,
      planKey,
      priceId: pilotPriceId(planKey),
    });
    const result = await createStripeCheckoutSession(secret, params);
    if ('error' in result) {
      console.error('Stripe pilot checkout error', result.error);
      return fail(req, result.error || 'Could not start pilot checkout.', 500);
    }
    try {
      await track('checkout-started', { plan: planKey, product: 'ava', pricing: 'pilot' }, { headers: req.headers });
    } catch (error) {
      console.error('Pilot checkout-started analytics failed', error);
    }
    if (isFormPost(req)) return NextResponse.redirect(result.url, 303);
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error(error);
    return fail(req, 'Could not start checkout.', 500);
  }
}
