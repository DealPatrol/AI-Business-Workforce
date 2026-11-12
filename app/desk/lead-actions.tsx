'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './desk.module.css';

const CHOICES = [
  { status: 'Contacted', label: 'Contacted' },
  { status: 'Booked', label: 'Won' },
  { status: 'Not a fit', label: 'Not a fit' },
] as const;

/** One-tap decisions on a lead. Uses the same PATCH /api/leads/[id] as the lead page. "Won" saves as Booked. */
export function LeadActions({ id, store = false, current = 'New' }: { id: string; store?: boolean; current?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function choose(status: string) {
    if (status === 'Booked' && !store && !window.confirm('Mark this lead as won (job booked)? This only updates the lead status.')) return;
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
      {CHOICES.filter((choice) => choice.status !== current).map((choice) => (
        <button
          key={choice.status}
          type="button"
          className={choice.status === 'Booked' ? styles.actionBooked : styles.action}
          disabled={Boolean(busy)}
          onClick={() => choose(choice.status)}
        >
          {busy === choice.status ? 'Saving…' : store && choice.status === 'Booked' ? 'Resolved' : choice.label}
        </button>
      ))}
      {error ? <p className={styles.actionError} role="alert">{error}</p> : null}
    </div>
  );
}
