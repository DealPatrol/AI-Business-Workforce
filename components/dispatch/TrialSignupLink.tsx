'use client';

import type { ReactNode } from 'react';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { trackTrialSignup } from '@/lib/analytics/events';
import { trackVercelEvent } from '@/lib/analytics/vercel-events';

type TrialSignupLinkProps = {
  href: string;
  className?: string;
  plan?: string;
  children: ReactNode;
};

/** Trial click sends StartTrial and Lead, each with its own event id, to the pixel and the server. */
export function TrialSignupLink({ href, className, plan = 'starter', children }: TrialSignupLinkProps) {
  return (
    <CheckoutForm
      href={href}
      className={className}
      onSubmit={() => {
        trackTrialSignup(plan);
        trackVercelEvent('signup-click', { plan, destination: 'trial' });
      }}
    >
      {children}
    </CheckoutForm>
  );
}
