'use client';

import type { ReactNode } from 'react';
import { trackCheckoutStarted } from '@/lib/analytics/events';

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
      }}
    >
      {children}
    </a>
  );
}
