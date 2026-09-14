/** Focused HVAC & plumbing pilot offer for sales week validation. */
export const AVA_PILOT_OFFER = {
  niche: 'Local HVAC & plumbing businesses',
  headline: 'Stop losing jobs when nobody can answer the phone.',
  subheadline:
    'Ava answers missed and after-hours calls, handles common questions, captures job details, and sends the owner a qualified lead summary.',
  setupFee: 250,
  monthlyFee: 299,
  pilotDays: 14,
  usageLimit: '300 voice minutes / month during pilot',
  cancelPolicy: 'Cancel anytime — no long-term contract',
  ctaPrimary: 'Try Ava for 14 days',
  ctaCall: 'Call Ava',
} as const;

export const AVA_PILOT_PAYMENT_LINK =
  process.env.NEXT_PUBLIC_AVA_PILOT_PAYMENT_LINK ?? 'https://buy.stripe.com/eVq8wR3Zk9kx9Gh0PO0Ba01';

export const SALES_WEEK_TARGETS = {
  prospectsContacted: 100,
  personalizedDemosSent: 20,
  conversations: 14,
  livePilotProposals: 6,
} as const;
