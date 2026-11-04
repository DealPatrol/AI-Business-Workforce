/**
 * Executive Receptionist self-serve receptionist pricing.
 *
 * Distinct from Muse / FirstMinute managed blueprint ($1,250/mo + $2,000 setup).
 * Executive Receptionist ships as software-led coverage with human launch help — not a full managed agency desk.
 */
export const AVA_PLANS = {
  starter: {
    key: 'starter',
    label: 'Starter',
    productName: 'Executive Receptionist – Starter',
    monthlyCents: 7700,
    monthlyLabel: '$77',
    minutes: 300,
    overageCents: 36,
    overageLabel: '$0.36/min after included usage',
    description: 'For smaller shops that need affordable after-hours and overflow coverage.',
    features: [
      'Executive Receptionist',
      '24/7 answering',
      'Lead qualification + summaries',
      'Lead texts to your phone',
      'Business-specific greeting & FAQs',
    ],
    featured: false,
  },
  growth: {
    key: 'growth',
    label: 'Growth',
    productName: 'Executive Receptionist – Growth',
    monthlyCents: 16800,
    monthlyLabel: '$168',
    minutes: 800,
    overageCents: 31,
    overageLabel: '$0.31/min after included usage',
    description: 'For teams that live on inbound estimates and cannot miss after-hours calls.',
    features: [
      'Everything in Starter',
      'More custom call flows',
      'Multiple service types',
      'Advanced lead qualification',
      'Advanced routing',
    ],
    featured: true,
  },
  pro: {
    key: 'pro',
    label: 'Pro',
    productName: 'Executive Receptionist – Pro',
    monthlyCents: 32400,
    monthlyLabel: '$324',
    minutes: 1800,
    overageCents: 26,
    overageLabel: '$0.26/min after included usage',
    description: 'For higher-volume shops that want a deeply configured front desk.',
    features: [
      'Everything in Growth',
      'Multiple call experiences',
      'Advanced routing logic',
      'Priority customization',
      'Deeper business configuration',
    ],
    featured: false,
  },
} as const;

export type AvaPlanKey = keyof typeof AVA_PLANS;

export const AVA_PLAN_KEYS = Object.keys(AVA_PLANS) as AvaPlanKey[];

/** Optional assisted launch (manual Cole/ops work) — not Muse’s $2,000 managed implementation. */
export const AVA_ASSISTED_LAUNCH = {
  label: 'Assisted launch',
  oneTimeCents: 38900,
  oneTimeLabel: '$389',
  description:
    'Optional one-time help: rules workshop, greeting polish, and a live test call before you forward the line.',
} as const;

/**
 * Canonical offer (Nov 2026). Replaces the Starter/Growth/Pro tiers in all customer copy.
 * NOTE: checkout (lib/stripe-checkout.ts, app/api/checkout) still sells AVA_PLANS until a metered
 * `booked_job` Stripe price exists. Do not deploy copy and checkout out of sync.
 */
export const AVA_OFFER = {
  pilotDays: 14,
  perBookedJobCents: 2500,
  perBookedJobLabel: '$25',
  monthlyCapCents: 29700,
  monthlyCapLabel: '$297',
  summary:
    'Free 14-day pilot, then $0 until your first booked job, then $25 per booked job, capped at $297/month. Set up in person in Gadsden.',
  guarantee:
    "If the receptionist doesn't capture a single real caller lead during your 14-day pilot, you pay nothing.",
  demoUrl: 'https://elevenlabs.io/app/talk-to?agent_id=agent_0001m6k8pwnaebqver0sztwknn72',
} as const;

export function isAvaPlanKey(value: string): value is AvaPlanKey {
  return value === 'starter' || value === 'growth' || value === 'pro';
}

export function avaPlanPriceLine(planKey: AvaPlanKey = 'starter') {
  return `${AVA_PLANS[planKey].monthlyLabel}/mo`;
}

export function avaTrialThenPriceCopy(planKey: AvaPlanKey = 'starter') {
  void planKey;
  return 'Free 14-day pilot, then $25 per booked job, max $297/mo. $0 until your first booked job.';
}

export function avaPricingSummaryCopy() {
  return AVA_OFFER.summary;
}
