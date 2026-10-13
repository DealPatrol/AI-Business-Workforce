'use client';

import { useState, type FormEvent } from 'react';
import type { AgentDefinition } from '@/lib/agents/catalog';
import styles from '@/components/suite/suite.module.css';

export function AgentForm({ agent }: { agent: AgentDefinition }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setDraft('');
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agent.id, fields: values }),
      });
      const payload = (await response.json().catch(() => null)) as { draft?: string; error?: string } | null;
      if (!response.ok || !payload?.draft) {
        setError(payload?.error || 'The draft could not be written.');
        return;
      }
      setDraft(payload.draft);
    } catch {
      setError('The draft could not be written. Check the connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={styles.section} style={{ paddingTop: 0 }}>
      <p>This writes a draft on this page. It does not email or text anyone.</p>
      {agent.fields.map((field) => (
        <label key={field.name} style={{ display: 'grid', gap: 6, margin: '14px 0', fontWeight: 700 }}>
          {field.label}
          {field.multiline ? (
            <textarea
              required={field.required}
              rows={5}
              placeholder={field.placeholder}
              value={values[field.name] || ''}
              onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
              style={{ font: 'inherit', fontWeight: 500, padding: 12, borderRadius: 8, border: '1px solid #d5ddd6' }}
            />
          ) : (
            <input
              required={field.required}
              placeholder={field.placeholder}
              value={values[field.name] || ''}
              onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
              style={{ font: 'inherit', fontWeight: 500, padding: 12, borderRadius: 8, border: '1px solid #d5ddd6' }}
            />
          )}
        </label>
      ))}
      <button className={styles.button} type="submit" disabled={busy} style={{ border: 0, cursor: 'pointer' }}>
        {busy ? 'Writing…' : 'Write the draft'}
      </button>
      {error ? (
        <p role="alert" className={styles.bad}>
          {error}
        </p>
      ) : null}
      {draft ? (
        <section aria-live="polite">
          <h2>Draft</h2>
          <pre style={{ whiteSpace: 'pre-wrap', font: 'inherit', background: '#fff', border: '1px solid #e1e7e1', borderRadius: 12, padding: 16 }}>
            {draft}
          </pre>
        </section>
      ) : null}
    </form>
  );
}
