import { track } from '@vercel/analytics/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  type AvaPlanKey,
  buildAvaCheckoutParams,
  buildFoundingCheckoutParams,
  createStripeCheckoutSession,
  isAvaPlanKey,
  readStripePriceId,
  safeCancelPath,
} from '@/lib/stripe-checkout';

function sanitizeQualificationId(value: unknown) {
  const id = String(value || '').trim();
  if (!id || id.length > 80 || !/^[a-zA-Z0-9_-]+$/.test(id)) return '';
  return id;
}

function sanitizePrefillToken(value: unknown) {
  const token = String(value || '').trim();
  if (!token || token.length > 400 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return '';
  return token;
}

function avaPriceId(planKey: AvaPlanKey) {
  switch (planKey) {
    case 'starter':
      return readStripePriceId(process.env.STRIPE_AVA_STARTER_PRICE_ID);
    case 'growth':
      return readStripePriceId(process.env.STRIPE_AVA_GROWTH_PRICE_ID);
    case 'pro':
      return readStripePriceId(process.env.STRIPE_AVA_PRO_PRICE_ID);
    default: {
      const unreachable: never = planKey;
      return unreachable;
    }
  }
}

async function foundingCheckoutUrl(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error('STRIPE_SECRET_KEY is not set; founding checkout cannot start.');
    return { error: 'Founding checkout is not connected yet.' };
  }

  const params = buildFoundingCheckoutParams({
    origin: req.nextUrl.origin,
    monthlyPriceId: readStripePriceId(process.env.STRIPE_FOUNDING_MONTHLY_PRICE_ID),
  });
  const cancelPath = safeCancelPath(req.nextUrl.searchParams.get('cancel'));
  params.set('cancel_url', `${req.nextUrl.origin}${cancelPath}`);

  const result = await createStripeCheckoutSession(secret, params);
  if ('error' in result) {
    console.error('Stripe founding checkout error', result.error);
    return { error: result.error };
  }
  return { url: result.url };
}

async function avaCheckoutUrl(
  req: NextRequest,
  planKey: AvaPlanKey,
  qualificationId?: string,
  prefillToken?: string,
) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error('STRIPE_SECRET_KEY is not set; Ava checkout cannot start.');
    return { error: 'Ava checkout is not connected yet.', status: 503 as const };
  }

  const params = buildAvaCheckoutParams({
    origin: req.nextUrl.origin,
    planKey,
    priceId: avaPriceId(planKey),
    qualificationId: sanitizeQualificationId(qualificationId),
    prefillToken: sanitizePrefillToken(prefillToken),
  });
  const result = await createStripeCheckoutSession(secret, params);
  if ('error' in result) {
    console.error('Stripe Ava checkout error', result.error);
    return { error: result.error || 'Could not start Ava checkout.', status: 500 as const };
  }
  try {
    await track('checkout-started', { plan: planKey, product: 'ava' }, { headers: req.headers });
  } catch (error) {
    console.error('Ava checkout-started analytics failed', error);
  }
  return { url: result.url };
}

function isFoundingRequest(offer: string, planKey: string) {
  return offer === 'founding' || planKey === 'founding';
}

export async function GET(req: NextRequest) {
  const offer = String(req.nextUrl.searchParams.get('offer') || '').toLowerCase();
  const planKey = String(req.nextUrl.searchParams.get('plan') || '').toLowerCase();

  if (isFoundingRequest(offer, planKey)) {
    try {
      const result = await foundingCheckoutUrl(req);
      if ('error' in result) return NextResponse.redirect(new URL('/founding?checkout=error', req.url));
      return NextResponse.redirect(result.url, 303);
    } catch (error) {
      console.error(error);
      return NextResponse.redirect(new URL('/founding?checkout=error', req.url));
    }
  }

  try {
    if (!isAvaPlanKey(planKey)) return NextResponse.redirect(new URL('/ava#pricing', req.url));
    const result = await avaCheckoutUrl(
      req,
      planKey,
      req.nextUrl.searchParams.get('qualificationId') || '',
      req.nextUrl.searchParams.get('prefillToken') || req.nextUrl.searchParams.get('token') || '',
    );
    if ('error' in result) return NextResponse.redirect(new URL('/ava?checkout=unavailable#pricing', req.url));
    return NextResponse.redirect(result.url, 303);
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL('/ava?checkout=unavailable#pricing', req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const offer = String(body?.offer || '').toLowerCase();
    const planKey = String(body?.plan || '').toLowerCase();

    if (isFoundingRequest(offer, planKey)) {
      const result = await foundingCheckoutUrl(req);
      if ('error' in result) {
        return NextResponse.json({ error: result.error || 'Could not start founding checkout.' }, { status: 500 });
      }
      return NextResponse.json({ url: result.url });
    }

    if (!isAvaPlanKey(planKey)) return NextResponse.json({ error: 'Invalid Ava plan.' }, { status: 400 });
    const result = await avaCheckoutUrl(
      req,
      planKey,
      String(body?.qualificationId || ''),
      String(body?.prefillToken || body?.token || ''),
    );
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 });
  }
}
