import { randomUUID } from 'crypto';
import { sendMetaServerEvent } from '@/lib/analytics/meta-capi';
import { clientIp, readCookieId } from '@/lib/analytics/request-context';

export type BuyLinkTrackingInput = {
  origin: string;
  planKey: string;
  userAgent?: string | null;
  forwardedFor?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export function buyLinkEventSourceUrl(origin: string, planKey: string) {
  return `${origin.replace(/\/$/, '')}/buy/${planKey}`;
}

/**
 * Fires Lead and InitiateCheckout on a successful /buy/{plan} checkout start.
 * /buy/* is a server redirect, so the browser pixel never runs on that URL.
 * This uses the Conversions API and no-ops when the pixel or token is unset.
 * Does not throw.
 */
export async function trackBuyLinkCheckout(input: BuyLinkTrackingInput) {
  const eventSourceUrl = buyLinkEventSourceUrl(input.origin, input.planKey);
  const shared = {
    eventSourceUrl,
    clientIp: clientIp(input.forwardedFor || null),
    userAgent: input.userAgent || '',
    fbp: readCookieId(input.fbp),
    fbc: readCookieId(input.fbc),
  };
  await Promise.all([
    sendMetaServerEvent({ eventName: 'InitiateCheckout', eventId: randomUUID(), ...shared }),
    sendMetaServerEvent({ eventName: 'Lead', eventId: randomUUID(), ...shared }),
  ]);
}
