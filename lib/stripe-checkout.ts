import {
  AVA_PLANS,
  type AvaPlanKey,
  isAvaPlanKey,
} from '@/lib/ava/pricing';
import { AVA_STORE_OFFER, STORE_CALL_EVENT_NAME, STORE_PLAN_KEY } from '@/lib/ava/store-pricing';
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
  planKey: AvaPlanKey;
  priceId?: string;
  /** Once-only coupon that makes the first month $1 (Starter only). */
  firstMonthCouponId?: string;
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

export const AVA_CHECKOUT_DISPLAY_NAME = 'Executive Receptionist';

export function readStripeCouponId(value: string | undefined) {
  const id = value?.trim() ?? '';
  return /^[A-Za-z0-9_-]{2,64}$/.test(id) ? id : '';
}

/**
 * Monthly plan checkout. Starter gets the once-only first-month coupon ($79 - $78 = $1 today, then $79/mo).
 * Growth, Pro and Elite charge the full monthly price today. No trial on any plan.
 */
export function buildAvaCheckoutParams(input: AvaCheckoutInput) {
  const plan = AVA_PLANS[input.planKey];
  if (!plan) throw new Error(`Unknown plan ${input.planKey}`);
  if (!input.priceId) throw new Error(`${plan.priceEnv} is not set`);
  const introCoupon = plan.firstMonthCents != null ? input.firstMonthCouponId || '' : '';
  if (plan.firstMonthCents != null && !introCoupon) throw new Error(`${plan.couponEnv} is not set`);

  const params = new URLSearchParams();
  const successParts = [
    'session_id={CHECKOUT_SESSION_ID}',
    `plan=${plan.key}`,
    ...(input.qualificationId ? [`qualificationId=${encodeURIComponent(input.qualificationId)}`] : []),
    ...(input.prefillToken ? [`prefillToken=${encodeURIComponent(input.prefillToken)}`] : []),
  ];
  params.set('mode', 'subscription');
  params.set('success_url', `${input.origin}/onboarding/ava?${successParts.join('&')}`);
  params.set('cancel_url', `${input.origin}/pricing#plans`);
  params.set('billing_address_collection', 'auto');
  params.set('payment_method_collection', 'always');
  params.set('branding_settings[display_name]', AVA_CHECKOUT_DISPLAY_NAME);
  params.set('line_items[0][price]', input.priceId);
  params.set('line_items[0][quantity]', '1');
  if (introCoupon) params.set('discounts[0][coupon]', introCoupon);
  const renewal = `${plan.monthlyLabel}/month, renews automatically each month. ${plan.minutesLabel} included per month. Cancel anytime.`;
  params.set(
    'custom_text[submit][message]',
    plan.firstMonthLabel ? `Today: ${plan.firstMonthLabel} for your first month. Then ${renewal}` : `Today: ${plan.monthlyLabel} for your first month. Then ${renewal}`,
  );
  const meta: Record<string, string> = {
    product: 'ava',
    plan: plan.key,
    offer: plan.firstMonthLabel ? 'first_month_1' : 'monthly',
    included_minutes: String(plan.minutes),
    monthly_cents: String(plan.monthlyCents),
  };
  if (input.qualificationId) meta.qualification_id = input.qualificationId;
  for (const [key, value] of Object.entries(meta)) {
    params.set(`metadata[${key}]`, value);
    params.set(`subscription_data[metadata][${key}]`, value);
  }
  return params;
}

type AvaStoreCheckoutInput = {
  origin: string;
  basePriceId?: string;
  callPriceId?: string;
  qualificationId?: string;
};

/**
 * Online-store plan: $119/month licensed price + $1/call metered price (`store_call` meter).
 * Same trial shape as the home-service pilot: 14 days free with a card on file.
 */
export function buildAvaStoreCheckoutParams(input: AvaStoreCheckoutInput) {
  if (!input.basePriceId || !input.callPriceId) {
    throw new Error('STRIPE_AVA_STORE_BASE_PRICE_ID and STRIPE_AVA_STORE_CALL_PRICE_ID must be set');
  }
  const params = new URLSearchParams();
  const successParts = [
    'session_id={CHECKOUT_SESSION_ID}',
    'plan=store',
    ...(input.qualificationId ? [`qualificationId=${encodeURIComponent(input.qualificationId)}`] : []),
  ];
  params.set('mode', 'subscription');
  params.set('success_url', `${input.origin}/onboarding/ava?${successParts.join('&')}`);
  params.set('cancel_url', `${input.origin}/start#ecommerce`);
  params.set('billing_address_collection', 'auto');
  params.set('allow_promotion_codes', 'true');
  params.set('payment_method_collection', 'always');
  params.set('subscription_data[trial_period_days]', String(AVA_STORE_OFFER.trialDays));
  params.set('line_items[0][price]', input.basePriceId);
  params.set('line_items[0][quantity]', '1');
  // Metered prices take no quantity.
  params.set('line_items[1][price]', input.callPriceId);
  params.set('metadata[product]', 'ava');
  params.set('metadata[plan]', STORE_PLAN_KEY);
  params.set('metadata[offer]', 'store');
  params.set('metadata[monthly_cents]', String(AVA_STORE_OFFER.monthlyCents));
  params.set('metadata[per_call_cents]', String(AVA_STORE_OFFER.perCallCents));
  if (input.qualificationId) params.set('metadata[qualification_id]', input.qualificationId);
  params.set('subscription_data[metadata][product]', 'ava');
  params.set('subscription_data[metadata][plan]', STORE_PLAN_KEY);
  params.set('subscription_data[metadata][offer]', 'store');
  params.set('subscription_data[metadata][meter_event]', STORE_CALL_EVENT_NAME);
  params.set('subscription_data[metadata][monthly_cents]', String(AVA_STORE_OFFER.monthlyCents));
  params.set('subscription_data[metadata][per_call_cents]', String(AVA_STORE_OFFER.perCallCents));
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
