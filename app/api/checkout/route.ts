import { track } from '@vercel/analytics/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  isPostcardSize,
  parsePostcardQuantity,
  type PostcardSize,
} from '@/lib/postcards/pricing';
import { lookupPostcardSetup } from '@/lib/postcards/setup-lookup';
import { normalizePostcardEmail, sanitizeStripeCustomerId } from '@/lib/postcards/setup-fee';
import {
  type AvaPlanKey,
  buildAvaCheckoutParams,
  buildPostcardCheckoutParams,
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

function postcardCardPriceId(size: PostcardSize) {
  switch (size) {
    case '4x6':
      return readStripePriceId(process.env.STRIPE_POSTCARD_4X6_PRICE_ID);
    case '6x9':
      return readStripePriceId(process.env.STRIPE_POSTCARD_6X9_PRICE_ID);
    default: {
      const unreachable: never = size;
      return unreachable;
    }
  }
}

function postcardSelection(size: unknown, quantity: unknown) {
  const normalized = String(size || '').toLowerCase();
  if (!isPostcardSize(normalized)) return null;
  const parsedQuantity = parsePostcardQuantity(quantity);
  if (parsedQuantity == null) return null;
  return { size: normalized, quantity: parsedQuantity };
}

async function postcardSetupForEmail(email: string) {
  if (!email) return { includeSetup: true, customerId: '', customerEmail: '' };
  try {
    const setup = await lookupPostcardSetup(email);
    return {
      includeSetup: !setup.paid,
      customerId: sanitizeStripeCustomerId(setup.customerId),
      customerEmail: email,
    };
  } catch (error) {
    console.error('Postcard setup lookup failed; charging the setup fee', error);
    return { includeSetup: true, customerId: '', customerEmail: email };
  }
}

async function postcardCheckoutUrl(
  req: NextRequest,
  size: PostcardSize,
  quantity: number,
  cancelPath: string,
  email: string,
) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error('STRIPE_SECRET_KEY is not set; postcard checkout cannot start.');
    return { error: 'Postcard checkout is not connected yet.' };
  }

  const setup = await postcardSetupForEmail(email);
  const params = buildPostcardCheckoutParams({
    origin: req.nextUrl.origin,
    cancelPath,
    size,
    quantity,
    includeSetup: setup.includeSetup,
    setupPriceId: readStripePriceId(process.env.STRIPE_POSTCARD_SETUP_PRICE_ID),
    cardPriceId: postcardCardPriceId(size),
    customerId: setup.customerId,
    customerEmail: setup.customerEmail,
  });

  const result = await createStripeCheckoutSession(secret, params);
  if ('error' in result) {
    console.error('Stripe postcard checkout error', result.error);
    return { error: result.error };
  }
  try {
    await track(
      'checkout-started',
      { plan: 'postcard', product: 'yardmailer', size, quantity: String(quantity) },
      { headers: req.headers },
    );
  } catch (error) {
    console.error('Postcard checkout-started analytics failed', error);
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
    console.error('STRIPE_SECRET_KEY is not set; Executive Receptionist checkout cannot start.');
    return { error: 'Executive Receptionist checkout is not connected yet.', status: 503 as const };
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
    console.error('Stripe Executive Receptionist checkout error', result.error);
    return { error: result.error || 'Could not start Executive Receptionist checkout.', status: 500 as const };
  }
  try {
    await track('checkout-started', { plan: planKey, product: 'ava' }, { headers: req.headers });
  } catch (error) {
    console.error('Executive Receptionist checkout-started analytics failed', error);
  }
  return { url: result.url };
}

function isPostcardRequest(offer: string, planKey: string) {
  return (
    offer === 'postcard' ||
    offer === 'yardmailer' ||
    offer === 'founding' ||
    planKey === 'postcard' ||
    planKey === 'yardmailer' ||
    planKey === 'founding'
  );
}

export async function GET(req: NextRequest) {
  const offer = String(req.nextUrl.searchParams.get('offer') || '').toLowerCase();
  const planKey = String(req.nextUrl.searchParams.get('plan') || '').toLowerCase();

  if (isPostcardRequest(offer, planKey)) {
    const selection = postcardSelection(
      req.nextUrl.searchParams.get('size'),
      req.nextUrl.searchParams.get('quantity'),
    );
    if (!selection) return NextResponse.redirect(new URL('/postcards#packages', req.url));
    try {
      const result = await postcardCheckoutUrl(
        req,
        selection.size,
        selection.quantity,
        safeCancelPath(req.nextUrl.searchParams.get('cancel')),
        normalizePostcardEmail(req.nextUrl.searchParams.get('email')),
      );
      if ('error' in result) return NextResponse.redirect(new URL('/founding?checkout=error', req.url));
      return NextResponse.redirect(result.url, 303);
    } catch (error) {
      console.error(error);
      return NextResponse.redirect(new URL('/founding?checkout=error', req.url));
    }
  }

  try {
    if (!isAvaPlanKey(planKey)) return NextResponse.redirect(new URL('/receptionist#pricing', req.url));
    const result = await avaCheckoutUrl(
      req,
      planKey,
      req.nextUrl.searchParams.get('qualificationId') || '',
      req.nextUrl.searchParams.get('prefillToken') || req.nextUrl.searchParams.get('token') || '',
    );
    if ('error' in result) return NextResponse.redirect(new URL('/receptionist?checkout=unavailable#pricing', req.url));
    return NextResponse.redirect(result.url, 303);
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL('/receptionist?checkout=unavailable#pricing', req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const offer = String(body?.offer || '').toLowerCase();
    const planKey = String(body?.plan || '').toLowerCase();

    if (isPostcardRequest(offer, planKey)) {
      const selection = postcardSelection(body?.size, body?.quantity);
      if (!selection) {
        return NextResponse.json(
          { error: 'Choose a 4x6 or 6x9 postcard and a quantity of at least 100.' },
          { status: 400 },
        );
      }
      const result = await postcardCheckoutUrl(
        req,
        selection.size,
        selection.quantity,
        safeCancelPath(typeof body?.cancel === 'string' ? body.cancel : ''),
        normalizePostcardEmail(body?.email),
      );
      if ('error' in result) {
        return NextResponse.json({ error: result.error || 'Could not start postcard checkout.' }, { status: 500 });
      }
      return NextResponse.json({ url: result.url });
    }

    if (!isAvaPlanKey(planKey)) return NextResponse.json({ error: 'Invalid Executive Receptionist plan.' }, { status: 400 });
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
