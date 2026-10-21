import { track } from '@vercel/analytics/server';
import { NextRequest, NextResponse } from 'next/server';
import { CHECKOUT_GET_REDIRECT_PATH, isKnownCrawlerUserAgent } from '@/lib/checkout-guard';
import {
  isPostcardSize,
  parsePostcardQuantity,
  type PostcardSize,
} from '@/lib/postcards/pricing';
import { postcardSetupForCheckout } from '@/lib/postcards/setup-session';
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

async function postcardCheckoutUrl(
  req: NextRequest,
  size: PostcardSize,
  quantity: number,
  cancelPath: string,
) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error('STRIPE_SECRET_KEY is not set; postcard checkout cannot start.');
    return { error: 'Postcard checkout is not connected yet.' };
  }

  // A buyer-supplied email is ignored. Setup is waived only for the signed-in verified user.
  const setup = await postcardSetupForCheckout();
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

function isFormPost(req: NextRequest) {
  const type = req.headers.get('content-type') || '';
  return type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data');
}

async function readPayload(req: NextRequest): Promise<Record<string, unknown>> {
  if (!isFormPost(req)) return (await req.json()) as Record<string, unknown>;
  const form = await req.formData();
  const payload: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') payload[key] = value;
  }
  return payload;
}

function checkoutResult(req: NextRequest, url: string) {
  if (isFormPost(req)) return NextResponse.redirect(url, 303);
  return NextResponse.json({ url });
}

function checkoutError(req: NextRequest, error: string, status: number, redirectPath: string) {
  if (isFormPost(req)) return NextResponse.redirect(new URL(redirectPath, req.url), 303);
  return NextResponse.json({ error }, { status });
}

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL(CHECKOUT_GET_REDIRECT_PATH, req.url), 307);
}

export async function POST(req: NextRequest) {
  if (isKnownCrawlerUserAgent(req.headers.get('user-agent'))) {
    return NextResponse.json({ error: 'Checkout is not available to crawlers.' }, { status: 403 });
  }

  const form = isFormPost(req);
  try {
    const body = await readPayload(req);
    const offer = String(body?.offer || '').toLowerCase();
    const planKey = String(body?.plan || '').toLowerCase();

    if (isPostcardRequest(offer, planKey)) {
      const selection = postcardSelection(body?.size, body?.quantity);
      if (!selection) {
        return checkoutError(
          req,
          'Choose a 4x6 or 6x9 postcard and a quantity of at least 100.',
          400,
          '/postcards#packages',
        );
      }
      const result = await postcardCheckoutUrl(
        req,
        selection.size,
        selection.quantity,
        safeCancelPath(typeof body?.cancel === 'string' ? body.cancel : ''),
      );
      if ('error' in result) {
        return checkoutError(req, result.error || 'Could not start postcard checkout.', 500, '/founding?checkout=error');
      }
      return checkoutResult(req, result.url);
    }

    if (!isAvaPlanKey(planKey)) {
      return checkoutError(req, 'Invalid Executive Receptionist plan.', 400, '/pricing');
    }
    const result = await avaCheckoutUrl(
      req,
      planKey,
      String(body?.qualificationId || ''),
      String(body?.prefillToken || body?.token || ''),
    );
    if ('error' in result) {
      return checkoutError(
        req,
        result.error || 'Could not start Executive Receptionist checkout.',
        result.status ?? 500,
        '/receptionist?checkout=unavailable#pricing',
      );
    }
    return checkoutResult(req, result.url);
  } catch (error) {
    console.error(error);
    return checkoutError(req, 'Could not start checkout.', 500, form ? '/pricing?checkout=error' : '/pricing');
  }
}
