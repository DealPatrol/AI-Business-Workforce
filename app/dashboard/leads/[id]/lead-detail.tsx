'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import TextUsButton from '@/components/leads/TextUsButton';
import { telHref } from '@/lib/leads/sms';
import { LEAD_STATUSES, type ErLead, type LeadStatus } from '@/lib/leads/types';
import styles from '../leads.module.css';

function formatTime(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Chicago',
  }).format(new Date(value));
}

export default function LeadDetail({ lead }: { lead: ErLead }) {
  const router = useRouter();
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');

  async function patch(body: { status?: LeadStatus; notes?: string }, label: string) {
    setError('');
    setSaving(label);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'The lead could not be updated.');
        return;
      }
      if (data.lead?.status) setStatus(data.lead.status);
      if (typeof data.lead?.notes === 'string') setNotes(data.lead.notes);
      router.refresh();
    } catch {
      setError('The lead could not be updated.');
    } finally {
      setSaving('');
    }
  }

  const callerTel = lead.caller_phone ? telHref(lead.caller_phone) : '';

  return (
    <>
      <div className={styles.panel}>
        <h2>{lead.caller_name || 'Unknown caller'}</h2>
        <div className={styles.row}><b>Status</b><span>{status}</span></div>
        <div className={styles.row}><b>Phone</b><span>{lead.caller_phone || 'Not captured'}</span></div>
        <div className={styles.row}><b>Job</b><span>{lead.job_type || 'Not captured'}</span></div>
        <div className={styles.row}><b>Source</b><span>{lead.source}</span></div>
        <div className={styles.row}><b>Called</b><span>{formatTime(lead.called_at)}</span></div>
        <div className={styles.row}><b>Booked</b><span>{formatTime(lead.booked_at)}</span></div>
        <div className={styles.row}><b>Summary</b><span>{lead.summary}</span></div>
        {lead.billing_skip_reason === 'missing_price_id' && (
          <p className={styles.meta}>Marked booked. Stripe metering is waiting on the booked-job price ID.</p>
        )}
        <div className={styles.links}>
          {callerTel ? <a href={callerTel}>Call caller</a> : null}
          {lead.caller_phone ? <TextUsButton phone={lead.caller_phone} label="Text caller" /> : null}
        </div>
      </div>

      <div className={styles.actions}>
        {LEAD_STATUSES.map((value) => (
          <button
            key={value}
            className={status === value ? `${styles.statusButton} ${styles.statusOn}` : styles.statusButton}
            type="button"
            disabled={Boolean(saving)}
            onClick={() => patch({ status: value }, value)}
          >
            {saving === value ? 'Saving…' : value}
          </button>
        ))}
      </div>

      <form
        className={styles.panel}
        onSubmit={(event) => {
          event.preventDefault();
          void patch({ notes }, 'notes');
        }}
      >
        <h2>Notes</h2>
        <textarea
          className={styles.notes}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Private notes for this lead"
        />
        <button className={styles.save} type="submit" disabled={Boolean(saving)}>
          {saving === 'notes' ? 'Saving…' : 'Save notes'}
        </button>
      </form>

      {error ? <div className={styles.alert} role="alert">{error}</div> : null}
    </>
  );
}
