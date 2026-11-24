import { AVA_PLANS, type AvaPlanKey } from '@/lib/ava/pricing';

/**
 * Google Business Profile (GBP) care add-on and Ava + GBP bundles.
 *
 * Prices approved by Cole on Nov 24, 2026 and sold through Stripe Checkout (live Workspace account,
 * the same account as the Ava plans). Price IDs live in Vercel env vars, like the Ava plans:
 * STRIPE_GBP_CARE_PRICE_ID, STRIPE_GBP_CARE_PLUS_PRICE_ID, STRIPE_GBP_SETUP_PRICE_ID (the existing
 * one-time $99 setup price), STRIPE_BUNDLE_ANSWERED_FOUND_PRICE_ID, STRIPE_BUNDLE_BOOKED_FOUND_PRICE_ID,
 * STRIPE_BUNDLE_FRONT_OF_MAP_PRICE_ID. Lookup keys: er_profile_care_monthly_99,
 * er_profile_care_plus_monthly_179, er_answered_found_monthly_159, er_booked_found_monthly_259,
 * er_front_of_map_monthly_499. Change a price in Stripe and here together.
 *
 * Benchmarks read Nov 24, 2026 on the providers' own pricing pages (done-for-you, one location):
 * BeeListed $149/mo, GBizPro $89 Essentials / $179 Managed, LocalPanda $199/mo,
 * L3ad Solutions $150 / $300.
 */
export const GBP_PRICES_ARE_PROPOSED = false;

/** Existing one-time setup (live Stripe link on frontporchgrowth.com/google-profile). */
export const GBP_SETUP = {
  label: 'Google profile setup',
  priceCents: 9900,
  priceLabel: '$99 one time',
  href: 'https://frontporchgrowth.com/google-profile',
  priceEnv: 'STRIPE_GBP_SETUP_PRICE_ID',
} as const;

export type GbpCareKey = 'care' | 'carePlus';

export const GBP_CARE = {
  care: {
    key: 'care',
    label: 'Profile Care',
    priceEnv: 'STRIPE_GBP_CARE_PRICE_ID',
    monthlyCents: 9900,
    monthlyLabel: '$99/mo',
    features: [
      '4 Google posts a month, written for your trade and town',
      'Hours, holiday hours, services and service area kept current',
      'Suggested edits from the public watched and corrected',
      'A drafted reply for every new review, ready for you to approve',
      'One-page monthly report from your profile’s own performance numbers',
    ],
  },
  carePlus: {
    key: 'carePlus',
    label: 'Profile Care Plus',
    priceEnv: 'STRIPE_GBP_CARE_PLUS_PRICE_ID',
    monthlyCents: 17900,
    monthlyLabel: '$179/mo',
    features: [
      'Everything in Profile Care',
      '8 Google posts a month',
      'Every review answered for you, in your voice',
      'Job photos you text us uploaded each month',
      'Questions on the profile answered',
      'Monthly call with Cole to pick next month’s focus',
    ],
  },
} as const;

export type GbpBundle = {
  key: string;
  label: string;
  plan: AvaPlanKey;
  care: GbpCareKey;
  monthlyCents: number;
  /** Separate monthly prices added together. */
  separateCents: number;
  badge: string;
  bestFor: string;
  setupWaived: boolean;
  priceEnv: string;
};

function bundle(input: Omit<GbpBundle, 'separateCents'>): GbpBundle {
  const separateCents = AVA_PLANS[input.plan].monthlyCents + GBP_CARE[input.care].monthlyCents;
  return { ...input, separateCents };
}

export const GBP_BUNDLES: GbpBundle[] = [
  bundle({
    key: 'local-starter',
    priceEnv: 'STRIPE_BUNDLE_ANSWERED_FOUND_PRICE_ID',
    label: 'Answered & Found',
    plan: 'starter',
    care: 'care',
    monthlyCents: 15900,
    badge: '',
    bestFor: 'One-truck shops that miss calls on the job and have a thin Google profile.',
    setupWaived: true,
  }),
  bundle({
    key: 'local-growth',
    priceEnv: 'STRIPE_BUNDLE_BOOKED_FOUND_PRICE_ID',
    label: 'Booked & Found',
    plan: 'growth',
    care: 'care',
    monthlyCents: 25900,
    badge: 'Most shops start here',
    bestFor: 'Shops whose phone rings most days and who want the profile kept fresh every week.',
    setupWaived: true,
  }),
  bundle({
    key: 'local-pro',
    priceEnv: 'STRIPE_BUNDLE_FRONT_OF_MAP_PRICE_ID',
    label: 'Front of the Map',
    plan: 'pro',
    care: 'carePlus',
    monthlyCents: 49900,
    badge: 'Best value',
    bestFor: 'Busy crews that want every call answered and every review replied to.',
    setupWaived: true,
  }),
];

export function usd(cents: number) {
  const dollars = cents / 100;
  return `$${Number.isInteger(dollars) ? dollars.toLocaleString('en-US') : dollars.toFixed(2)}`;
}

/** Monthly saving against buying the Ava plan and the care tier separately. */
export function bundleMonthlySavingsLabel(b: GbpBundle) {
  return usd(b.separateCents - b.monthlyCents);
}

export function gbpCareKeyFromParam(value: string): GbpCareKey | null {
  const v = value.trim().toLowerCase();
  if (v === 'care') return 'care';
  if (v === 'careplus' || v === 'care-plus') return 'carePlus';
  return null;
}

export function gbpBundleFromParam(value: string): GbpBundle | null {
  const v = value.trim().toLowerCase();
  return GBP_BUNDLES.find((b) => b.key === v) ?? null;
}
