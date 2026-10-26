'use client';

import { useEffect } from 'react';
import { trackDemoCallClick } from '@/lib/analytics/events';

/** Sends a Lead when a visitor taps any tel: link (the live demo number) inside this page. */
export function DemoCallLeadTracking() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest('a[href^="tel:"]') : null;
      if (target) trackDemoCallClick();
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
}
