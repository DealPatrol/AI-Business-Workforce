import {
  AVA_PLANS,
  type AvaPlanKey,
  isAvaPlanKey,
} from '@/lib/ava/pricing';
import { avaPricingPathForOrigin } from '@/lib/site';

const STRIPE_API = 'https://api.stripe.com/v1';
export const STRIPE_API_VERSION = '2026-07-29.dahlia';

export const FOUNDING_PRODUCT_NAME = 'YardProof Founding Plan';
export const FOUNDING_MONTHLY_CENTS = 9900;

export { AVA_PLANS, type AvaPlanKey, isAvaPlanKey };

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

type FoundingCheckoutInput = {
  origin: string;
  monthlyPriceId?: string;
};

type AvaCheckoutInput = {
  origin: string;
  planKey: AvaPlanKey;
  priceId?: string;
  qualificationId?: string;
  prefillToken?: string;
};

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

export function buildFoundingCheckoutParams(input: FoundingCheckoutInput) {
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set(
    'success_url',
    `${input.origin}/founding?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
  );
  params.set('cancel_url', `${input.origin}/`);
  params.set('billing_address_collection', 'auto');
  params.set('allow_promotion_codes', 'true');
  appendRecurringPrice(params, 0, {
    priceId: input.monthlyPriceId,
    unitAmount: FOUNDING_MONTHLY_CENTS,
    productName: FOUNDING_PRODUCT_NAME,
    description: '$99/month for the managed founding campaign.',
  });
  params.set('metadata[product]', 'yardproof');
  params.set('metadata[offer]', 'founding');
  params.set('metadata[monthly_cents]', String(FOUNDING_MONTHLY_CENTS));
  params.set('subscription_data[metadata][product]', 'yardproof');
  params.set('subscription_data[metadata][offer]', 'founding');
  params.set('subscription_data[metadata][monthly_cents]', String(FOUNDING_MONTHLY_CENTS));
  return params;
}

export function buildAvaCheckoutParams(input: AvaCheckoutInput) {
  const plan = AVA_PLANS[input.planKey];
  const params = new URLSearchParams();
  const successParts = [
    'session_id={CHECKOUT_SESSION_ID}',
    `plan=${input.planKey}`,
    ...(input.qualificationId ? [`qualificationId=${encodeURIComponent(input.qualificationId)}`] : []),
    ...(input.prefillToken ? [`prefillToken=${encodeURIComponent(input.prefillToken)}`] : []),
  ];
  params.set('mode', 'subscription');
  params.set('success_url', `${input.origin}/onboarding/ava?${successParts.join('&')}`);
  params.set('cancel_url', `${input.origin}${avaPricingPathForOrigin(input.origin)}`);
  params.set('billing_address_collection', 'auto');
  params.set('allow_promotion_codes', 'true');
  // Stripe Checkout trial: 7 days before first charge when using price_data or Dashboard prices without their own trial.
  params.set('subscription_data[trial_period_days]', '7');
  appendRecurringPrice(params, 0, {
    priceId: input.priceId,
    unitAmount: plan.monthlyCents,
    productName: plan.productName,
    description: `${plan.minutes} included voice minutes/month; overage $${(plan.overageCents / 100).toFixed(2)}/minute.`,
  });
  params.set('metadata[product]', 'ava');
  params.set('metadata[plan]', input.planKey);
  params.set('metadata[included_minutes]', String(plan.minutes));
  params.set('metadata[overage_cents]', String(plan.overageCents));
  if (input.qualificationId) params.set('metadata[qualification_id]', input.qualificationId);
  params.set('subscription_data[metadata][product]', 'ava');
  params.set('subscription_data[metadata][plan]', input.planKey);
  params.set('subscription_data[metadata][included_minutes]', String(plan.minutes));
  params.set('subscription_data[metadata][overage_cents]', String(plan.overageCents));
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
