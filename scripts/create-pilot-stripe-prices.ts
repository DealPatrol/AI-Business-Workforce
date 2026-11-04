/**
 * Optional: create reusable Stripe Products + monthly Prices for the three pilot tiers.
 *
 * The pilot checkout works WITHOUT this (it falls back to inline price_data). Run this only if you
 * want clean, reusable Prices in the Dashboard. It prints a plan by default and creates NOTHING.
 *
 *   pnpm exec node --experimental-strip-types --experimental-loader ./scripts/ava-security-test-loader.mjs \
 *     scripts/create-pilot-stripe-prices.ts            # dry run: lists what would be created
 *   STRIPE_SECRET_KEY=sk_live_... pnpm exec node ... scripts/create-pilot-stripe-prices.ts --apply
 *
 * Idempotent by lookup_key: a Price whose lookup_key already exists is reused, not duplicated.
 * The $50-per-booked-job charges are ad-hoc invoice items (amount only); no Product/Price is needed.
 */
import { PILOT_PLANS, PILOT_PLAN_KEYS, pilotPriceIdEnvName } from '@/lib/ava/pilot-pricing';

const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2026-07-29.dahlia';
const apply = process.argv.includes('--apply');

function describePlan() {
  return PILOT_PLAN_KEYS.map((key) => {
    const plan = PILOT_PLANS[key];
    return {
      product: plan.productName,
      price: `$${(plan.baseCents / 100).toFixed(2)} USD / month (recurring, licensed)`,
      lookup_key: plan.lookupKey,
      env_var_to_set: pilotPriceIdEnvName(key),
    };
  });
}

async function stripe(path: string, secret: string, body?: URLSearchParams) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Stripe-Version': STRIPE_VERSION,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: body?.toString(),
  });
  const data = (await response.json()) as Record<string, any>;
  if (!response.ok) throw new Error(data?.error?.message || `Stripe ${response.status}`);
  return data;
}

async function main() {
  console.log(apply ? 'APPLY mode: creating Stripe objects.\n' : 'DRY RUN: nothing will be created. Pass --apply to create.\n');
  console.table(describePlan());
  if (!apply) return;

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) throw new Error('STRIPE_SECRET_KEY is required with --apply.');

  for (const key of PILOT_PLAN_KEYS) {
    const plan = PILOT_PLANS[key];
    const existing = await stripe(`/prices?lookup_keys[]=${encodeURIComponent(plan.lookupKey)}&limit=1`, secret);
    if (existing.data?.[0]) {
      console.log(`${pilotPriceIdEnvName(key)}=${existing.data[0].id}  (already existed)`);
      continue;
    }
    const product = await stripe(
      '/products',
      secret,
      new URLSearchParams({
        name: plan.productName,
        'metadata[pricing]': 'pilot',
        'metadata[plan]': key,
      }),
    );
    const price = await stripe(
      '/prices',
      secret,
      new URLSearchParams({
        product: product.id,
        currency: 'usd',
        unit_amount: String(plan.baseCents),
        'recurring[interval]': 'month',
        lookup_key: plan.lookupKey,
        'metadata[pricing]': 'pilot',
        'metadata[plan]': key,
      }),
    );
    console.log(`${pilotPriceIdEnvName(key)}=${price.id}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
