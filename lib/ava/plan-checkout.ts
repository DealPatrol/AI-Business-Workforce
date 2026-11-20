import { AVA_PLANS, type AvaPlanKey } from '@/lib/ava/pricing';
import {
  buildAvaCheckoutParams,
  createStripeCheckoutSession,
  readStripeCouponId,
  readStripePriceId,
} from '@/lib/stripe-checkout';

/** Price ID for a plan from env (STRIPE_AVA_<PLAN>_PRICE_ID). */
export function avaPlanPriceId(planKey: AvaPlanKey, env: NodeJS.ProcessEnv = process.env) {
  return readStripePriceId(env[AVA_PLANS[planKey].priceEnv]);
}

/** Which monthly plan a Stripe price belongs to (from the STRIPE_AVA_<PLAN>_PRICE_ID env vars). */
export function avaPlanForPriceId(priceId: string | null | undefined, env: NodeJS.ProcessEnv = process.env): AvaPlanKey | null {
  const id = String(priceId || '').trim();
  if (!id) return null;
  for (const key of Object.keys(AVA_PLANS) as AvaPlanKey[]) {
    if (avaPlanPriceId(key, env) === id) return key;
  }
  return null;
}

/** Starter's once-only first-month coupon from env. */
export function avaFirstMonthCouponId(planKey: AvaPlanKey, env: NodeJS.ProcessEnv = process.env) {
  const name = AVA_PLANS[planKey].couponEnv;
  return name ? readStripeCouponId(env[name]) : '';
}

/** Creates a Stripe Checkout Session for one monthly plan. Never throws. */
export async function startAvaPlanCheckout(input: {
  origin: string;
  planKey: AvaPlanKey;
  qualificationId?: string;
  prefillToken?: string;
}) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error('STRIPE_SECRET_KEY is not set; Executive Receptionist checkout cannot start.');
    return { error: 'Executive Receptionist checkout is not connected yet.', status: 503 as const };
  }
  let params: URLSearchParams;
  try {
    params = buildAvaCheckoutParams({
      origin: input.origin,
      planKey: input.planKey,
      priceId: avaPlanPriceId(input.planKey),
      firstMonthCouponId: avaFirstMonthCouponId(input.planKey),
      qualificationId: input.qualificationId,
      prefillToken: input.prefillToken,
    });
  } catch (error) {
    console.error('Executive Receptionist checkout could not be built', error);
    return { error: 'Executive Receptionist checkout is not connected yet.', status: 503 as const };
  }
  const result = await createStripeCheckoutSession(secret, params);
  if ('error' in result) {
    console.error('Stripe Executive Receptionist checkout error', result.error);
    return { error: result.error || 'Could not start Executive Receptionist checkout.', status: 500 as const };
  }
  return { url: result.url };
}
