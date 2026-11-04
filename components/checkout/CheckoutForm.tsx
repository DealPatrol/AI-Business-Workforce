'use client';

import type { FormEvent, ReactNode } from 'react';

const CHECKOUT_FIELDS = [
  'plan',
  'offer',
  'size',
  'quantity',
  'cancel',
  'qualificationId',
  'prefillToken',
  'token',
] as const;

type CheckoutFormProps = {
  href: string;
  className?: string;
  children: ReactNode;
  onSubmit?: () => void;
  /** Defaults to the live checkout. The pilot page posts to /api/checkout/pilot. */
  action?: string;
};

function checkoutFields(href: string) {
  const params = new URLSearchParams(href.split('?')[1] || '');
  return CHECKOUT_FIELDS.flatMap((key) => {
    const value = params.get(key);
    return value ? [{ key, value }] : [];
  });
}

/** POSTs to checkout so a plain link crawl cannot open a Stripe session. */
export function CheckoutForm({ href, className, children, onSubmit, action = '/api/checkout' }: CheckoutFormProps) {
  const fields = checkoutFields(href);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    onSubmit?.();
    const button = event.currentTarget.querySelector('button');
    if (button) button.disabled = true;
  }

  return (
    <form className="checkout-form" method="POST" action={action} onSubmit={handleSubmit}>
      {fields.map((field) => (
        <input key={field.key} type="hidden" name={field.key} value={field.value} />
      ))}
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
