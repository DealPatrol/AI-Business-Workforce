export const FOUNDING_CTA = 'Start for $99/month';

/** Subscription Checkout Session for the $99/month YardProof founding plan. */
export function foundingCheckoutHref(cancelPath?: string) {
  if (!cancelPath || cancelPath === '/') return '/api/checkout?offer=founding';
  return `/api/checkout?offer=founding&cancel=${encodeURIComponent(cancelPath)}`;
}
