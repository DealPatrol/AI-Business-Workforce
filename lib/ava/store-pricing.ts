/**
 * Online-store plan (Nov 2026, decided by Cole).
 *
 * $119/month plus $1 for each call Ava handles (a "service call"), after a free
 * 14-day trial with a card on file. Home-service pricing (AVA_OFFER) is unchanged.
 *
 * Stripe (Workspace account):
 *   STRIPE_AVA_STORE_BASE_PRICE_ID  licensed $119/month price
 *   STRIPE_AVA_STORE_CALL_PRICE_ID  metered $1/unit monthly price on the `store_call` meter
 */
export const STORE_PLAN_KEY = 'store';
export const STORE_CALL_EVENT_NAME = 'store_call';

export const AVA_STORE_OFFER = {
  trialDays: 14,
  monthlyCents: 11900,
  monthlyLabel: '$119',
  perCallCents: 100,
  perCallLabel: '$1',
  priceLine: '$119/month + $1 per call Ava handles',
  summary:
    'Free 14-day trial with a card on file. Then $119/month plus $1 for each call Ava handles. Calls during the trial are free.',
  callDefinition:
    'A handled call is a completed call where the caller spoke to Ava. Hang-ups before anyone speaks, and calls Ava flags as spam or a wrong number, are not counted.',
  ctaLabel: 'Start store pilot',
} as const;

export function storeMonthlyEstimateCents(handledCalls: number) {
  const calls = Number.isFinite(handledCalls) ? Math.max(0, Math.floor(handledCalls)) : 0;
  return AVA_STORE_OFFER.monthlyCents + calls * AVA_STORE_OFFER.perCallCents;
}
