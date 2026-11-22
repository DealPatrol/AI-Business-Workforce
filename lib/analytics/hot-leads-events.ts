/**
 * Meta Pixel events for the $20 Hot Leads (500) funnel.
 * Browser-only: value and currency, no personal data.
 * The pixel itself is loaded by AdTracking in the root layout when a pixel id is set.
 */

export const HOT_LEADS_500_VALUE = 20;
export const HOT_LEADS_CURRENCY = 'USD';

const PURCHASE_PARAMS = { value: HOT_LEADS_500_VALUE, currency: HOT_LEADS_CURRENCY } as const;

function metaPixelEnabled() {
  return typeof document !== 'undefined' && document.documentElement.dataset.metaPixel === 'on';
}

function fireMeta(
  event: 'InitiateCheckout' | 'Purchase',
  eventId?: string,
) {
  if (!metaPixelEnabled() || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  if (eventId) {
    window.fbq('track', event, { ...PURCHASE_PARAMS }, { eventID: eventId });
  } else {
    window.fbq('track', event, { ...PURCHASE_PARAMS });
  }
}

/** Fire on checkout-button click. Do not await this; navigation must not wait. */
export function trackHotLeadsInitiateCheckout() {
  fireMeta('InitiateCheckout');
}

/**
 * Fire Purchase once per paid Stripe Checkout Session.
 * sessionStorage stops repeat fires on reload; the event id lets Meta dedupe too.
 */
export function trackHotLeadsPurchase(sessionId: string) {
  if (typeof window === 'undefined') return '';
  const safe = sessionId.replace(/[^A-Za-z0-9_]/g, '').slice(0, 80);
  if (!safe) return '';
  const eventId = `purchase-${safe}`;
  const key = `meta-hot-leads-purchase:${safe}`;
  try {
    if (window.sessionStorage.getItem(key)) return eventId;
    window.sessionStorage.setItem(key, '1');
  } catch {
    // storage blocked; still send once for this render
  }
  fireMeta('Purchase', eventId);
  return eventId;
}
