import {
  AVA_PLANS,
  type AvaPlanKey,
  isAvaPlanKey,
} from '@/lib/ava/pricing';
import {
  POSTCARD_SETUP_CENTS,
  POSTCARD_SIZES,
  type PostcardSize,
} from '@/lib/postcards/pricing';

const STRIPE_API = 'https://api.stripe.com/v1';
export const STRIPE_API_VERSION = '2026-07-29.dahlia';

export const POSTCARD_CHECKOUT_PRODUCT = 'yardmailer';
/** Legacy founding Checkout sessions used this product name. Treat it like yardmailer. */
export const LEGACY_POSTCARD_CHECKOUT_PRODUCT = 'yardproof';
export const POSTCARD_SETUP_NAME = 'YardMailer setup';

export { AVA_PLANS, type AvaPlanKey, isAvaPlanKey };

export function isPostcardCheckoutProduct(product: string | null | undefined) {
  return product === POSTCARD_CHECKOUT_PRODUCT || product === LEGACY_POSTCARD_CHECKOUT_PRODUCT;
}

export function safeCancelPath(value: string | null | undefined) {
  const fallback = '/';
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('://')) {
    return fallback;
  }
  if (value.length > 200 || !/^\/[A-Za-z0-9/_?#&=%.-]*$/.test(value)) return fallback;
  return value;
}

export function readStripePriceId(value: string | undefined) {
  const priceId = value?.trim() ?? '';
  if (!priceId) return '';
  return /^price_[A-Za-z0-9]+$/.test(priceId) ? priceId : '';
}

type PostcardCheckoutInput = {
  origin: string;
  cancelPath: string;
  size: PostcardSize;
  quantity: number;
  includeSetup?: boolean;
  setupPriceId?: string;
  cardPriceId?: string;
  customerId?: string;
  customerEmail?: string;
};

type AvaCheckoutInput = {
  origin: string;
  planKey?: string;
  priceId?: string;
  qualificationId?: string;
  prefillToken?: string;
};

function appendOneTimePrice(
  params: URLSearchParams,
  index: number,
  input: { priceId?: string; quantity: number; unitAmount: number; productName: string; description: string },
) {
  params.set(`line_items[${index}][quantity]`, String(input.quantity));
  if (input.priceId) {
    params.set(`line_items[${index}][price]`, input.priceId);
    return;
  }
  params.set(`line_items[${index}][price_data][currency]`, 'usd');
  params.set(`line_items[${index}][price_data][unit_amount]`, String(input.unitAmount));
  params.set(`line_items[${index}][price_data][product_data][name]`, input.productName);
  params.set(`line_items[${index}][price_data][product_data][description]`, input.description);
}

function appendRecurringPrice(
  params: URLSearchParams,
  index: number,
  input: { priceId?: string; unitAmount: number; productName: string; description: string },
) {
  params.set(`line_items[${index}][quantity]`, '1');
  if (input.priceId) {
    params.set(`line_items[${index}][price]`, input.priceId);
    return;
  }
  params.set(`line_items[${index}][price_data][currency]`, 'usd');
  params.set(`line_items[${index}][price_data][unit_amount]`, String(input.unitAmount));
  params.set(`line_items[${index}][price_data][recurring][interval]`, 'month');
  params.set(`line_items[${index}][price_data][product_data][name]`, input.productName);
  params.set(`line_items[${index}][price_data][product_data][description]`, input.description);
}

export function buildPostcardCheckoutParams(input: PostcardCheckoutInput) {
  const card = POSTCARD_SIZES[input.size];
  const includeSetup = input.includeSetup !== false;
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set(
    'success_url',
    `${input.origin}/founding?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
  );
  params.set('cancel_url', `${input.origin}${input.cancelPath}`);
  params.set('billing_address_collection', 'auto');
  params.set('allow_promotion_codes', 'true');
  let line = 0;
  if (includeSetup) {
    appendOneTimePrice(params, line, {
      priceId: input.setupPriceId,
      quantity: 1,
      unitAmount: POSTCARD_SETUP_CENTS,
      productName: POSTCARD_SETUP_NAME,
      description: '$127 one-time setup, charged once per customer.',
    });
    line += 1;
  }
  appendOneTimePrice(params, line, {
    priceId: input.cardPriceId,
    quantity: input.quantity,
    unitAmount: card.unitCents,
    productName: card.productName,
    description: `${card.unitLabel} per ${card.label} card. Postage, printing, and mailing included.`,
  });
  const setupCents = includeSetup ? POSTCARD_SETUP_CENTS : 0;
  params.set('metadata[product]', POSTCARD_CHECKOUT_PRODUCT);
  params.set('metadata[size]', input.size);
  params.set('metadata[quantity]', String(input.quantity));
  params.set('metadata[setup_charged]', includeSetup ? 'true' : 'false');
  params.set('metadata[setup_cents]', String(setupCents));
  params.set('metadata[unit_cents]', String(card.unitCents));
  params.set('payment_intent_data[metadata][product]', POSTCARD_CHECKOUT_PRODUCT);
  params.set('payment_intent_data[metadata][size]', input.size);
  params.set('payment_intent_data[metadata][quantity]', String(input.quantity));
  params.set('payment_intent_data[metadata][setup_charged]', includeSetup ? 'true' : 'false');
  if (input.customerId) {
    params.set('customer', input.customerId);
  } else {
    params.set('customer_creation', 'always');
    if (input.customerEmail) params.set('customer_email', input.customerEmail);
  }
  return params;
}

export function buildAvaCheckoutParams(input: AvaCheckoutInput) {
  const params = new URLSearchParams();
  const planKey = input.planKey || 'pilot';
  const successParts = [
    'session_id={CHECKOUT_SESSION_ID}',
    `plan=${planKey}`,
    ...(input.qualificationId ? [`qualificationId=${encodeURIComponent(input.qualificationId)}`] : []),
    ...(input.prefillToken ? [`prefillToken=${encodeURIComponent(input.prefillToken)}`] : []),
  ];
  params.set('mode', 'subscription');
  params.set('success_url', `${input.origin}/onboarding/ava?${successParts.join('&')}`);
  params.set('cancel_url', `${input.origin}/pricing#plans`);
  params.set('billing_address_collection', 'auto');
  params.set('allow_promotion_codes', 'true');
  params.set('payment_method_collection', 'always');
  params.set('subscription_data[trial_period_days]', '14');
  // Metered prices cannot be created inline. The booked-job price ID must be set.
  if (!input.priceId) {
    throw new Error('STRIPE_AVA_BOOKED_JOB_PRICE_ID is not set');
  }
  params.set('line_items[0][price]', input.priceId);
  params.set('metadata[product]', 'ava');
  params.set('metadata[plan]', 'pilot');
  params.set('metadata[offer]', 'booked_job');
  params.set('metadata[monthly_cap_cents]', '29700');
  if (input.qualificationId) params.set('metadata[qualification_id]', input.qualificationId);
  params.set('subscription_data[metadata][product]', 'ava');
  params.set('subscription_data[metadata][plan]', 'pilot');
  params.set('subscription_data[metadata][offer]', 'booked_job');
  params.set('subscription_data[metadata][meter_event]', 'booked_job');
  params.set('subscription_data[metadata][monthly_cap_cents]', '29700');
  if (input.qualificationId) {
    params.set('subscription_data[metadata][qualification_id]', input.qualificationId);
  }
  return params;
}

type StripeSessionResponse = {
  url?: string;
  error?: { message?: string };
};

export async function createStripeCheckoutSession(secret: string, params: URLSearchParams) {
  const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION,
    },
    body: params.toString(),
    cache: 'no-store',
  });
  const data = (await response.json().catch(() => ({}))) as StripeSessionResponse;
  if (!response.ok || !data.url) {
    return { error: data.error?.message || 'Could not start checkout.' };
  }
  return { url: data.url };
}
