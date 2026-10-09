'use client';

import { FormEvent, useState } from 'react';
import styles from './suite.module.css';

type WaitlistStatus = 'idle' | 'saving' | 'done' | 'error';

export function InvoicingWaitlistForm() {
  const [status, setStatus] = useState<WaitlistStatus>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const form = event.currentTarget;
    setStatus('saving');
    setMessage('');
    try {
      const response = await fetch('/api/invoicing/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(data.get('email') || ''),
          name: String(data.get('name') || ''),
          businessName: String(data.get('businessName') || ''),
          companyWebsite: String(data.get('companyWebsite') || ''),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; alreadyOnList?: boolean };
      if (!response.ok) {
        setStatus('error');
        setMessage(body.error || 'Could not save that. Try again.');
        return;
      }
      setStatus('done');
      setMessage(
        body.alreadyOnList
          ? 'That address is already on the invoicing list.'
          : 'You are on the list. This form does not send email.',
      );
      form.reset();
    } catch {
      setStatus('error');
      setMessage('Could not save that. Try again.');
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
      </label>
      <label>
        Name
        <input name="name" autoComplete="name" placeholder="Optional" />
      </label>
      <label>
        Business
        <input name="businessName" autoComplete="organization" placeholder="Optional" />
      </label>
      <label className={styles.honeypot} aria-hidden="true">
        Company website
        <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
      </label>
      <button type="submit" disabled={status === 'saving'}>
        {status === 'saving' ? 'Saving…' : 'Join the invoicing list'}
      </button>
      {message ? <p className={status === 'error' ? `${styles.note} ${styles.bad}` : `${styles.note} ${styles.ok}`}>{message}</p> : null}
    </form>
  );
}
