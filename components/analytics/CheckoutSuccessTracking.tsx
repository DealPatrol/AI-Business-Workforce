'use client';

import { useEffect } from 'react';
import { trackCheckoutCompleted } from '@/lib/analytics/events';

/** Fires StartTrial once per Stripe checkout session on the post-checkout page. */
export function CheckoutSuccessTracking({ sessionId, plan }: { sessionId: string; plan?: string }) {
  useEffect(() => {
    if (sessionId) trackCheckoutCompleted(sessionId, plan);
  }, [sessionId, plan]);
  return null;
}
