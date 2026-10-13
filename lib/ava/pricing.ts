/**
 * Ava self-serve receptionist pricing.
 *
 * Distinct from Muse / FirstMinute managed blueprint ($1,250/mo + $2,000 setup).
 * Ava ships as software-led coverage with human launch help — not a full managed agency desk.
 */
export const AVA_PLANS = {
  starter: {
    key: 'starter',
    label: 'Starter',
    productName: 'Ava Receptionist – Starter',
    monthlyCents: 7900,
    monthlyLabel: '$79',
    minutes: 165,
    overageCents: 40,
    overageLabel: '$0.40/min after included usage',
    description: 'For smaller shops that need affordable after-hours and overflow coverage.',
    features: [
      '24/7 answering on your forwarded line',
      'Lead text + call summary email after every call',
      'Call log with recordings and transcripts',
      'Missed-call text-back and booking-link text',
      'Live transfer to your cell on rules you set',
    ],
    featured: false,
  },
  growth: {
    key: 'growth',
    label: 'Growth',
    productName: 'Ava Receptionist – Growth',
    monthlyCents: 14900,
    monthlyLabel: '$149',
    minutes: 320,
    overageCents: 40,
    overageLabel: '$0.40/min after included usage',
    description: 'For teams that live on inbound estimates and cannot miss after-hours calls.',
    features: [
      'Everything in Starter',
      'About 2x the minutes of Starter',
      'Questions set per service type',
      'Separate urgent-call rules',
    ],
    featured: true,
  },
  pro: {
    key: 'pro',
    label: 'Pro',
    productName: 'Ava Receptionist – Pro',
    monthlyCents: 29900,
    monthlyLabel: '$299',
    minutes: 650,
    overageCents: 40,
    overageLabel: '$0.40/min after included usage',
    description: 'For higher-volume shops that take a lot of calls.',
    features: [
      'Everything in Growth',
      'About 2x the minutes of Growth',
      'Lowest cost per included minute',
    ],
    featured: false,
  },
} as const;

export type AvaPlanKey = keyof typeof AVA_PLANS;

export const AVA_PLAN_KEYS = Object.keys(AVA_PLANS) as AvaPlanKey[];

/** Optional assisted launch (manual Cole/ops work) — not Muse’s $2,000 managed implementation. */
export const AVA_ASSISTED_LAUNCH = {
  label: 'Assisted launch',
  oneTimeCents: 29900,
  oneTimeLabel: '$299',
  description:
    'Optional one-time help: rules workshop, greeting polish, and a live test call before you forward the line.',
} as const;

export function isAvaPlanKey(value: string): value is AvaPlanKey {
  return value === 'starter' || value === 'growth' || value === 'pro';
}

export function avaPlanPriceLine(planKey: AvaPlanKey = 'starter') {
  return `${AVA_PLANS[planKey].monthlyLabel}/mo`;
}

export function avaTrialThenPriceCopy(planKey: AvaPlanKey = 'starter') {
  return `Free 7-day trial, then ${AVA_PLANS[planKey].monthlyLabel}/mo. $0 setup.`;
}

export function avaPricingSummaryCopy() {
  return `Free 7-day trial, then Starter ${AVA_PLANS.starter.monthlyLabel}/mo. Growth ${AVA_PLANS.growth.monthlyLabel}. Pro ${AVA_PLANS.pro.monthlyLabel}. $0 setup.`;
}
