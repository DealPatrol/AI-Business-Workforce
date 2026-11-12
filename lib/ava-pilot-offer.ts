/** Copy for the personalized prospect demo pages. Pricing comes from lib/ava/pricing.ts. */
export const AVA_PILOT_OFFER = {
  niche: 'Local HVAC & plumbing businesses',
  headline: 'Stop losing jobs when nobody can answer the phone.',
  subheadline:
    'Executive Receptionist answers missed and after-hours calls, handles common questions, captures job details, and sends the owner a qualified lead summary.',
  cancelPolicy: 'Cancel anytime — no long-term contract',
  ctaPrimary: 'Start Executive Receptionist for $1',
  ctaCall: 'Call Executive Receptionist',
} as const;

/** Starter checkout: $1 first month, then $79/month. */
export const AVA_PILOT_PAYMENT_LINK = '/buy/starter';

export const SALES_WEEK_TARGETS = {
  prospectsContacted: 100,
  personalizedDemosSent: 20,
  conversations: 14,
  livePilotProposals: 6,
} as const;
