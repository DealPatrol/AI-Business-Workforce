/**
 * Maps Stripe invoice webhook events to the `subscription_status` stored on
 * `ava_customers`. The stored status is the access switch: the post-call gate
 * (lib/ava/post-call-gate) only saves leads and sends mail/SMS for 'active'
 * or 'trialing' customers, so a failed payment must land as a non-paying
 * status as soon as Stripe reports it — not whenever dunning happens to end.
 */

/** Stripe subscription states that already mean "not paying" on their own. */
const NON_BILLING_LIVE_STATUSES = new Set([
  'past_due',
  'unpaid',
  'canceled',
  'paused',
  'incomplete_expired',
]);

export type AvaInvoiceEventKind = 'paid' | 'payment_failed';

/**
 * `liveStatus` is the subscription's current status read back from the Stripe
 * API ('' when unreadable). Stripe is ground truth when it reports one; the
 * fallbacks cover the window where the API read is unavailable.
 */
export function resolveInvoiceSubscriptionStatus(
  kind: AvaInvoiceEventKind,
  liveStatus: string,
): string {
  const live = (liveStatus || '').trim().toLowerCase();

  if (kind === 'payment_failed') {
    // Trust Stripe when it already reports a delinquent/terminal state.
    // Otherwise the failed invoice is itself the earliest past_due signal:
    // during Smart Retries the subscription can still read 'active' while
    // the customer is not actually paying.
    return NON_BILLING_LIVE_STATUSES.has(live) ? live : 'past_due';
  }

  // invoice.paid: keep Stripe's own status — a $0 trial invoice can be
  // "paid" while the subscription is still trialing, and paying one invoice
  // does not cure a different outstanding one. With no live read, a paid
  // invoice means the subscription is back in good standing.
  return live || 'active';
}
