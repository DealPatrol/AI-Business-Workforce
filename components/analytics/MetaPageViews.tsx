'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics/events';

/**
 * The inline pixel snippet fires the first PageView. This fires one more on each
 * client-side route change, so App Router navigations are counted too.
 */
export function MetaPageViews() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    trackPageView();
  }, [pathname]);
  return null;
}
