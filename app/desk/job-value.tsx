'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './desk.module.css';

/** Owner's average job value; the Desk multiplies booked outcomes by it for estimated revenue. */
export function JobValueForm({ cents }: { cents: number | null }) {
  const router = useRouter();
  const [value, setValue] = useState(cents === null ? '' : String(cents / 100));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch('/api/desk/job-value', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; note?: string };
      if (!response.ok) throw new Error(data.error || 'Could not save.');
      setStatus({ kind: 'ok', text: data.note || 'Saved.' });
      router.refresh();
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Could not save.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.jobValue} onSubmit={save}>
      <label htmlFor="desk-job-value">Average job value</label>
      <div>
        <span aria-hidden="true">$</span>
        <input
          id="desk-job-value"
          inputMode="decimal"
          placeholder="450"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {status ? (
        <p className={status.kind === 'ok' ? styles.saveOk : styles.actionError} role="status">
          {status.text}
        </p>
      ) : null}
    </form>
  );
}
