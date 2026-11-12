'use client';

import { useState } from 'react';
import styles from './desk.module.css';

type Props = {
  greeting: string;
  greetingEditable: boolean;
  notificationEmail: string;
  businessHours: string;
};

type Field = 'greeting' | 'notificationEmail' | 'businessHours';

/** Ava's greeting, the new-lead alert email, and business hours. Each saves on its own. */
export function DeskSettings(props: Props) {
  const [values, setValues] = useState({
    greeting: props.greeting,
    notificationEmail: props.notificationEmail,
    businessHours: props.businessHours,
  });
  const [saving, setSaving] = useState<Field | ''>('');
  const [status, setStatus] = useState<{ field: Field; kind: 'ok' | 'error'; text: string } | null>(null);

  async function save(field: Field) {
    setSaving(field);
    setStatus(null);
    try {
      const response = await fetch('/api/desk/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: values[field] }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; note?: string };
      if (!response.ok) throw new Error(data.error || 'Could not save.');
      setStatus({ field, kind: 'ok', text: data.note || 'Saved.' });
    } catch (error) {
      setStatus({ field, kind: 'error', text: error instanceof Error ? error.message : 'Could not save.' });
    } finally {
      setSaving('');
    }
  }

  function note(field: Field) {
    if (status?.field !== field) return null;
    return (
      <p className={status.kind === 'ok' ? styles.saveOk : styles.actionError} role="status">
        {status.text}
      </p>
    );
  }

  return (
    <div className={styles.settingsForm}>
      <div className={styles.field}>
        <label htmlFor="desk-greeting">Ava’s greeting</label>
        <small>The first thing callers hear.</small>
        <textarea
          id="desk-greeting"
          rows={3}
          maxLength={300}
          value={values.greeting}
          disabled={!props.greetingEditable}
          placeholder={props.greetingEditable ? '' : 'Opens once your own receptionist is live.'}
          onChange={(e) => setValues((v) => ({ ...v, greeting: e.target.value }))}
        />
        {props.greetingEditable ? (
          <button type="button" disabled={Boolean(saving)} onClick={() => save('greeting')}>
            {saving === 'greeting' ? 'Saving…' : 'Save greeting'}
          </button>
        ) : (
          <small>Your Desk is still on the shared demo receptionist, so the greeting is locked until your own Ava goes live.</small>
        )}
        {note('greeting')}
      </div>

      <div className={styles.field}>
        <label htmlFor="desk-email">Notification email</label>
        <small>Where new-lead alerts go after each call.</small>
        <input
          id="desk-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={values.notificationEmail}
          onChange={(e) => setValues((v) => ({ ...v, notificationEmail: e.target.value }))}
        />
        <button type="button" disabled={Boolean(saving)} onClick={() => save('notificationEmail')}>
          {saving === 'notificationEmail' ? 'Saving…' : 'Save email'}
        </button>
        {note('notificationEmail')}
      </div>

      <div className={styles.field}>
        <label htmlFor="desk-hours">Business hours</label>
        <small>What Ava tells callers, for example “Mon–Fri 8–5, Sat 9–noon, emergencies 24/7”.</small>
        <textarea
          id="desk-hours"
          rows={2}
          maxLength={600}
          value={values.businessHours}
          onChange={(e) => setValues((v) => ({ ...v, businessHours: e.target.value }))}
        />
        <button type="button" disabled={Boolean(saving)} onClick={() => save('businessHours')}>
          {saving === 'businessHours' ? 'Saving…' : 'Save hours'}
        </button>
        {note('businessHours')}
      </div>
    </div>
  );
}
