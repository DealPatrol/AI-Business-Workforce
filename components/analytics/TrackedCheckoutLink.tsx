'use client';

import type { ReactNode } from 'react';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
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
    <CheckoutForm
      href={href}
      className={className}
      onSubmit={() => {
        trackCheckoutStarted(plan);
        trackVercelEvent('signup-click', { plan: plan || 'starter', destination: 'checkout' });
      }}
    >
      {children}
    </CheckoutForm>
  );
}
