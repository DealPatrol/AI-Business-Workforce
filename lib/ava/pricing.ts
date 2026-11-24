/**
 * Executive Receptionist pricing: five monthly plans billed by included minutes.
 *
 * Overflow (added Nov 23, 2026 by Cole): $25/month for 60 minutes, then $1.00 per minute over 60.
 * It is the only plan with per-minute overage. Overage is billed after the fact as an invoice item
 * (Stripe price STRIPE_AVA_OVERFLOW_MINUTE_PRICE_ID when a metered price exists; see
 * docs/AVA_OVERFLOW_BILLING.md). Overflow only claims answering, caller details and the email summary.
 *
 * Only Starter has an intro offer: the first month is $1 (a once-only Stripe coupon), then $79/month.
 * Growth, Pro and Elite charge full price from the first month. No free trial, no free plan.
 * Starter and up have no metered overage: past the included minutes Ava keeps answering and we
 * reach out about moving up a plan.
 */
export const AVA_PLANS = {
  overflow: {
    key: 'overflow',
    label: 'Overflow',
    productName: 'Executive Receptionist - Overflow',
    monthlyCents: 2500,
    monthlyLabel: '$25',
    minutes: 60,
    minutesLabel: '60 minutes',
    perMinuteLabel: '$0.42/min',
    firstMonthCents: null,
    firstMonthLabel: null,
    overageCentsPerMinute: 100,
    overageLabel: '$1/min after 60',
    priceEnv: 'STRIPE_AVA_OVERFLOW_PRICE_ID',
    couponEnv: null,
    description: 'For tight budgets. Ava covers your line during set hours or as overflow when you can’t pick up.',
    features: [
      '60 minutes included, then $1/min after 60',
      'Answers your calls 24/7',
      'Captures the caller’s name, number, and what they need',
      'Emails you a summary of every call',
    ],
    valueNote: '',
    badge: 'Lowest price',
    featured: false,
  },
  starter: {
    key: 'starter',
    label: 'Starter',
    productName: 'Executive Receptionist - Starter',
    monthlyCents: 7900,
    monthlyLabel: '$79',
    minutes: 100,
    minutesLabel: '100 minutes',
    perMinuteLabel: '$0.79/min',
    firstMonthCents: 100,
    firstMonthLabel: '$1',
    overageCentsPerMinute: null,
    overageLabel: null,
    priceEnv: 'STRIPE_AVA_STARTER_PRICE_ID',
    couponEnv: 'STRIPE_AVA_STARTER_FIRST_MONTH_COUPON_ID',
    description: 'Try Ava on your line for $1. For small shops that need after-hours and overflow coverage.',
    features: ['100 minutes of Ava answering each month', 'Everything listed below'],
    valueNote: '',
    badge: 'Start for $1',
    featured: false,
  },
  growth: {
    key: 'growth',
    label: 'Growth',
    productName: 'Executive Receptionist - Growth',
    monthlyCents: 19700,
    monthlyLabel: '$197',
    minutes: 300,
    minutesLabel: '300 minutes',
    perMinuteLabel: '$0.66/min',
    firstMonthCents: null,
    firstMonthLabel: null,
    overageCentsPerMinute: null,
    overageLabel: null,
    priceEnv: 'STRIPE_AVA_GROWTH_PRICE_ID',
    couponEnv: null,
    description: 'For shops whose phone rings most days and who cannot miss the after-hours repair call.',
    features: ['300 minutes of Ava answering each month', 'Everything listed below'],
    valueNote: '',
    badge: '',
    featured: false,
  },
  pro: {
    key: 'pro',
    label: 'Pro',
    productName: 'Executive Receptionist - Pro',
    monthlyCents: 39700,
    monthlyLabel: '$397',
    minutes: 1200,
    minutesLabel: '1,200 minutes',
    perMinuteLabel: '$0.33/min',
    firstMonthCents: null,
    firstMonthLabel: null,
    overageCentsPerMinute: null,
    overageLabel: null,
    priceEnv: 'STRIPE_AVA_PRO_PRICE_ID',
    couponEnv: null,
    description: 'The best value per minute. For busy shops that want every call answered, day and night.',
    features: ['1,200 minutes of Ava answering each month', 'Lowest price per minute of any plan', 'Everything listed below'],
    valueNote: '4x the minutes of Growth for about 2x the price.',
    badge: 'Most popular · Best value',
    featured: true,
  },
  elite: {
    key: 'elite',
    label: 'Elite',
    productName: 'Executive Receptionist - Elite',
    monthlyCents: 78900,
    monthlyLabel: '$789',
    minutes: 2000,
    minutesLabel: '2,000 minutes',
    perMinuteLabel: '$0.39/min',
    firstMonthCents: null,
    firstMonthLabel: null,
    overageCentsPerMinute: null,
    overageLabel: null,
    priceEnv: 'STRIPE_AVA_ELITE_PRICE_ID',
    couponEnv: null,
    description: 'The most minutes, with priority setup. For the highest-volume shops.',
    features: ['2,000 minutes of Ava answering each month', 'Priority setup: first in line for your setup', 'Everything listed below'],
    valueNote: '',
    badge: '',
    featured: false,
  },
} as const;

export type AvaPlanKey = keyof typeof AVA_PLANS;

export const AVA_PLAN_KEYS = Object.keys(AVA_PLANS) as AvaPlanKey[];

/** True on every plan today. Keep this list to features that work in production. */
export const AVA_PLAN_INCLUDES = [
  'Answers your business line 24/7 with a greeting written for your shop',
  'Takes the caller’s name, callback number, address, and what the job is',
  'Emails you a summary of every call',
  'Switches to Spanish when the caller does',
  'Flags emergencies so you see them first',
  'Your Desk: every call and lead in one place',
  'Month to month. Cancel anytime.',
] as const;

/** Shared offer facts used across the site. */
export const AVA_OFFER = {
  summary:
    'Five monthly plans: Overflow $25 (60 minutes, then $1/min after 60), Starter $79 (100 minutes, first month $1), Growth $197 (300 minutes), Pro $397 (1,200 minutes), Elite $789 (2,000 minutes). Renews monthly. Cancel anytime.',
  starterIntro: 'Starter: first month $1, then $79/month. Renews automatically. Cancel anytime.',
  renewalNote: 'Plans renew monthly at the listed price until you cancel. Cancel anytime.',
  overageNote:
    'On Starter, Growth, Pro and Elite, if you run past your minutes, Ava keeps answering and we reach out about moving you up a plan. No surprise per-minute charges. Overflow is the one plan with overage: $1 per minute after 60, billed on your next invoice.',
  overflowLine: 'Overflow $25/month: 60 minutes included, then $1/min after 60.',
  demoUrl: 'https://elevenlabs.io/app/talk-to?agent_id=agent_0001m6k8pwnaebqver0sztwknn72',
  contactPhoneDisplay: '(256) 595-3354',
  contactPhoneHref: 'tel:+12565953354',
  contactEmail: 'colecollins763@gmail.com',
  setupCity: 'Gadsden',
  footerLine: 'Executive Receptionist is operated by Cole Collins DBA Executive Receptionist, 12476 County Road 747, Hanceville, AL 35077',
} as const;

export function isAvaPlanKey(value: string): value is AvaPlanKey {
  return Object.prototype.hasOwnProperty.call(AVA_PLANS, value);
}

/** "Starter $79/mo · 100 minutes" style line. */
export function avaPlanPriceLine(planKey: AvaPlanKey = 'starter') {
  const plan = AVA_PLANS[planKey];
  return `${plan.label} ${plan.monthlyLabel}/month, ${plan.minutesLabel} included`;
}

/** What the buyer pays today and after, for one plan. */
export function avaPlanBillingLine(planKey: AvaPlanKey) {
  const plan = AVA_PLANS[planKey];
  if (plan.firstMonthLabel) {
    return `First month ${plan.firstMonthLabel}, then ${plan.monthlyLabel}/month. Renews automatically. Cancel anytime.`;
  }
  if (plan.overageLabel) {
    return `${plan.monthlyLabel}/month, billed today and monthly after. ${plan.minutesLabel} included, ${plan.overageLabel}. Cancel anytime.`;
  }
  return `${plan.monthlyLabel}/month, billed today and monthly after. Cancel anytime.`;
}

export function avaPricingSummaryCopy() {
  return AVA_OFFER.summary;
}
