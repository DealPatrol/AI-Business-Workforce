'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from './qr-page.module.css';

type EstimateRequestFormProps = {
  token: string;
  businessName: string;
};

type FormStatus =
  | { state: 'idle' }
  | { state: 'submitting' }
  | { state: 'success' }
  | { state: 'error'; message: string };

export default function EstimateRequestForm({ token, businessName }: EstimateRequestFormProps) {
  const [status, setStatus] = useState<FormStatus>({ state: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ state: 'submitting' });

    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch(`/api/q/${encodeURIComponent(token)}/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json();

      if (!response.ok) {
        setStatus({ state: 'error', message: result.error ?? 'Please try again.' });
        return;
      }

      form.reset();
      setStatus({ state: 'success' });
    } catch {
      setStatus({ state: 'error', message: 'Could not send your request. Please try again.' });
    }
  }

  if (status.state === 'success') {
    return (
      <div className={styles.success}>
        <CheckCircle2 />
        <h2>Request received.</h2>
        <p>{businessName} now has your details and can follow up about an estimate.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <span>FREE ESTIMATE REQUEST</span>
      <h2>Interested in a project?</h2>
      <p>Tell {businessName} how to reach you. There’s no obligation.</p>

      <label>
        Your name
        <input name="name" autoComplete="name" maxLength={120} required />
      </label>
      <div className={styles.contactFields}>
        <label>
          Phone
          <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" maxLength={254} />
        </label>
      </div>
      <label>
        What would you like an estimate for?
        <textarea name="message" rows={4} maxLength={2_000} />
      </label>
      <label className={styles.honeypot} aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      {status.state === 'error' && <p className={styles.error} role="alert">{status.message}</p>}
      <button type="submit" disabled={status.state === 'submitting'}>
        {status.state === 'submitting' ? 'Sending…' : 'Request my estimate'}
        {status.state !== 'submitting' && <ArrowRight size={17} />}
      </button>
      <small>Please include either a phone number or email.</small>
    </form>
  );
}
