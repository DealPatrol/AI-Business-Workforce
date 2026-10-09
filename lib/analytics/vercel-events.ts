import { track } from '@vercel/analytics';

export type VercelFunnelEvent = 'demo-play' | 'signup-click' | 'checkout-started';

type EventProperties = Record<string, string | number | boolean | null>;

/** Client events for Vercel Web Analytics. Never throws into the funnel. */
export function trackVercelEvent(name: VercelFunnelEvent, properties?: EventProperties) {
  try {
    track(name, properties);
  } catch {
    // Analytics is optional until the Vercel project enables Web Analytics.
  }
}
