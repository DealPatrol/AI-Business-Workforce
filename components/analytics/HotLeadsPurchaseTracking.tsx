'use client';

import { useEffect } from 'react';
import { trackHotLeadsPurchase } from '@/lib/analytics/hot-leads-events';

/** Fires a $20 Purchase once per paid Hot Leads checkout session. */
export function HotLeadsPurchaseTracking({ sessionId }: { sessionId: string }) {
  useEffect(() => {
    if (sessionId) trackHotLeadsPurchase(sessionId);
  }, [sessionId]);
  return null;
}
