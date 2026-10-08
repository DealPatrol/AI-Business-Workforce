'use client';

import type { ReactNode } from 'react';
import { trackCheckoutStarted } from '@/lib/analytics/events';
import { trackVercelEvent } from '@/lib/analytics/vercel-events';

type TrackedCheckoutLinkProps = {
  href: string;
  className?: string;
  plan?: string;
  children: ReactNode;
};

export function TrackedCheckoutLink({ href, className, plan, children }: TrackedCheckoutLinkProps) {
  return (
    <a
      className={className}
      href={href}
      onClick={() => {
        trackCheckoutStarted(plan);
        trackVercelEvent('signup-click', { plan: plan || 'starter', destination: 'checkout' });
      }}
    >
      {children}
    </a>
  );
}
