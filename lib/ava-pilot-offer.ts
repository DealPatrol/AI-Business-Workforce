/** Focused HVAC & plumbing pilot offer for sales week validation. */
export const AVA_PILOT_OFFER = {
  niche: 'Local HVAC & plumbing businesses',
  headline: 'Stop losing jobs when nobody can answer the phone.',
  subheadline:
    'Front Porch Dispatch answers missed and after-hours calls, handles common questions, captures job details, and sends the owner a qualified lead summary.',
  pilotDays: 14,
  usageLimit: '300 voice minutes / month during pilot',
  cancelPolicy: 'Cancel anytime — no long-term contract',
  ctaPrimary: 'Try Front Porch Dispatch for 14 days',
  ctaCall: 'Call Front Porch Dispatch',
} as const;

export const AVA_PILOT_PAYMENT_LINK =
  process.env.NEXT_PUBLIC_AVA_PILOT_PAYMENT_LINK || '/dispatch#pricing';

export const SALES_WEEK_TARGETS = {
  prospectsContacted: 100,
  personalizedDemosSent: 20,
  conversations: 14,
  livePilotProposals: 6,
} as const;
