'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './desk.module.css';

const CHOICES = [
  { status: 'Contacted', label: 'I called them' },
  { status: 'Booked', label: 'Booked the job' },
  { status: 'Not a fit', label: 'Not a fit' },
] as const;

/** One-tap decisions on a new lead. Uses the same PATCH /api/leads/[id] as the lead page. */
export function LeadActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function choose(status: string) {
    if (status === 'Booked' && !window.confirm('Mark this as a booked job? Booked jobs are billed at $25 each, max $297 a month.')) return;
    setBusy(status);
    setError('');
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'That did not save. Try again.');
        return;
      }
      router.refresh();
    } catch {
      setError('That did not save. Try again.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className={styles.actions}>
      {CHOICES.map((choice) => (
        <button
          key={choice.status}
          type="button"
          className={choice.status === 'Booked' ? styles.actionBooked : styles.action}
          disabled={Boolean(busy)}
          onClick={() => choose(choice.status)}
        >
          {busy === choice.status ? 'Saving…' : choice.label}
        </button>
      ))}
      {error ? <p className={styles.actionError} role="alert">{error}</p> : null}
    </div>
  );
}
