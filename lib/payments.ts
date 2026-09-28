export const FOUNDING_PAYMENT_LINK = 'https://buy.stripe.com/eVq8wR3Zk9kx9Gh0PO0Ba01';

/** Checkout Session route. Falls back to FOUNDING_PAYMENT_LINK only when STRIPE_SECRET_KEY is unset. */
export function foundingCheckoutHref(cancelPath?: string) {
  if (!cancelPath || cancelPath === '/') return '/api/checkout?offer=founding';
  return `/api/checkout?offer=founding&cancel=${encodeURIComponent(cancelPath)}`;
}
