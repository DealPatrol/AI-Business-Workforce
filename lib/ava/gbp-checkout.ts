import { AVA_PLANS } from '@/lib/ava/pricing';
import { GBP_CARE, GBP_SETUP, usd, type GbpBundle, type GbpCareKey } from '@/lib/ava/gbp-packages';
import { AVA_CHECKOUT_DISPLAY_NAME, createStripeCheckoutSession, readStripePriceId } from '@/lib/stripe-checkout';

/**
 * Stripe Checkout for Google profile care (product=gbp, frontporchgrowth.com) and the Ava + Google
 * profile bundles (product=ava, so the existing Stripe webhook provisions Ava from metadata.plan).
 */
type Env = NodeJS.ProcessEnv;

function setMeta(params: URLSearchParams, meta: Record<string, string>) {
  for (const [key, value] of Object.entries(meta)) {
    params.set(`metadata[${key}]`, value);
    params.set(`subscription_data[metadata][${key}]`, value);
  }
}

/** Care tier: monthly price plus the existing one-time $99 setup on the first invoice. */
export function buildGbpCareCheckoutParams(input: { origin: string; careKey: GbpCareKey; env?: Env }) {
  const env = input.env ?? process.env;
  const care = GBP_CARE[input.careKey];
  const priceId = readStripePriceId(env[care.priceEnv]);
  const setupPriceId = readStripePriceId(env[GBP_SETUP.priceEnv]);
  if (!priceId) throw new Error(`${care.priceEnv} is not set`);
  if (!setupPriceId) throw new Error(`${GBP_SETUP.priceEnv} is not set`);
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('success_url', `${input.origin}/google-profile/management?checkout=success&plan=${care.key}&session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${input.origin}/google-profile/management#start`);
  params.set('billing_address_collection', 'auto');
  params.set('payment_method_collection', 'always');
  params.set('branding_settings[display_name]', 'Front Porch Growth');
  params.set('line_items[0][price]', priceId);
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[1][price]', setupPriceId);
  params.set('line_items[1][quantity]', '1');
  const today = usd(care.monthlyCents + GBP_SETUP.priceCents);
  params.set(
    'custom_text[submit][message]',
    `Today: ${today} (${usd(GBP_SETUP.priceCents)} one-time profile setup + your first month). Then ${care.monthlyLabel}, renews monthly. Cancel anytime.`,
  );
  setMeta(params, {
    product: 'gbp',
    plan: care.key,
    site: 'frontporchgrowth',
    monthly_cents: String(care.monthlyCents),
    setup_cents: String(GBP_SETUP.priceCents),
  });
  return params;
}

/** Bundle: one monthly price, setup included. Success goes to the normal Ava onboarding. */
export function buildGbpBundleCheckoutParams(input: { origin: string; bundle: GbpBundle; env?: Env }) {
  const env = input.env ?? process.env;
  const { bundle } = input;
  const plan = AVA_PLANS[bundle.plan];
  const priceId = readStripePriceId(env[bundle.priceEnv]);
  if (!priceId) throw new Error(`${bundle.priceEnv} is not set`);
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('success_url', `${input.origin}/onboarding/ava?session_id={CHECKOUT_SESSION_ID}&plan=${plan.key}&bundle=${bundle.key}`);
  params.set('cancel_url', `${input.origin}/receptionist/packages#bundles`);
  params.set('billing_address_collection', 'auto');
  params.set('payment_method_collection', 'always');
  params.set('branding_settings[display_name]', AVA_CHECKOUT_DISPLAY_NAME);
  params.set('line_items[0][price]', priceId);
  params.set('line_items[0][quantity]', '1');
  params.set(
    'custom_text[submit][message]',
    `Today: ${usd(bundle.monthlyCents)} for your first month, Google profile setup included. Then ${usd(bundle.monthlyCents)}/month: Ava ${plan.label} (${plan.minutesLabel}) + ${GBP_CARE[bundle.care].label}. Cancel anytime.`,
  );
  setMeta(params, {
    product: 'ava',
    plan: plan.key,
    offer: 'bundle',
    bundle: bundle.key,
    gbp_care: bundle.care,
    included_minutes: String(plan.minutes),
    monthly_cents: String(bundle.monthlyCents),
  });
  return params;
}

export async function startGbpCheckout(params: () => URLSearchParams) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return { error: 'Checkout is not connected yet.', status: 503 as const };
  let built: URLSearchParams;
  try {
    built = params();
  } catch (error) {
    console.error('Google profile checkout could not be built', error);
    return { error: 'Checkout is not connected yet.', status: 503 as const };
  }
  const result = await createStripeCheckoutSession(secret, built);
  if ('error' in result) {
    console.error('Stripe Google profile checkout error', result.error);
    return { error: result.error || 'Could not start checkout.', status: 500 as const };
  }
  return { url: result.url };
}
