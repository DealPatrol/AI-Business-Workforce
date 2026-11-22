'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackHotLeadsInitiateCheckout } from '@/lib/analytics/hot-leads-events';
import { withUtmParams } from '@/lib/lead-lists/utm';

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

export function CheckoutLink({ href, className, children }: Props) {
  const searchParams = useSearchParams();
  const destination = withUtmParams(href, searchParams);

  return (
    <a
      className={className}
      href={destination}
      onClick={() => {
        // Fire and continue. Do not preventDefault or await — navigation must not wait.
        trackHotLeadsInitiateCheckout();
      }}
    >
      {children}
    </a>
  );
}
