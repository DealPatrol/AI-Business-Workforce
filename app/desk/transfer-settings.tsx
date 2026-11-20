'use client';

import { useState } from 'react';
import type { TransferReason, TransferRule } from '@/lib/ava/capabilities/transfer';
import { TRANSFER_REASON_LABEL } from '@/lib/desk/transfer-settings';
import styles from './desk.module.css';

type Row = { label: string; phone: string; reason: TransferReason; when: string };

const MAX = 3;
const EMPTY: Row = { label: '', phone: '', reason: 'person', when: '' };

function pretty(phone: string) {
  const d = phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : phone;
}

function toRows(rules: TransferRule[]): Row[] {
  return rules.map((r) => ({ label: r.label, phone: pretty(r.phone), reason: r.reason, when: r.when ?? '' }));
}

/** Up to three named numbers Ava can hand a caller to, each with when to use it. */
export function TransferSettings({ rules, live }: { rules: TransferRule[]; live: boolean }) {
  const [rows, setRows] = useState<Row[]>(rules.length ? toRows(rules) : [{ ...EMPTY, reason: 'emergency' }]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  function update(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch('/api/desk/transfer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: rows }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; note?: string; rules?: TransferRule[] };
      if (!response.ok) throw new Error(data.error || 'Could not save.');
      if (data.rules) setRows(data.rules.length ? toRows(data.rules) : [{ ...EMPTY }]);
      setStatus({ kind: 'ok', text: data.note || 'Saved.' });
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Could not save.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.settingsForm}>
      {rows.map((row, index) => (
        <fieldset key={index} className={styles.transferRow}>
          <legend>Number {index + 1}</legend>
          <div className={styles.transferGrid}>
            <label>
              <span>Name</span>
              <input
                value={row.label}
                maxLength={40}
                placeholder="On-call tech"
                onChange={(e) => update(index, { label: e.target.value })}
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                value={row.phone}
                inputMode="tel"
                autoComplete="off"
                placeholder="(205) 555-0100"
                onChange={(e) => update(index, { phone: e.target.value })}
              />
            </label>
            <label>
              <span>Use it for</span>
              <select value={row.reason} onChange={(e) => update(index, { reason: e.target.value as TransferReason })}>
                {(Object.keys(TRANSFER_REASON_LABEL) as TransferReason[]).map((key) => (
                  <option key={key} value={key}>
                    {TRANSFER_REASON_LABEL[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {row.reason === 'custom' ? (
            <label className={styles.transferWhen}>
              <span>When should Ava use this number?</span>
              <input
                value={row.when}
                maxLength={200}
                placeholder="Caller wants a quote on a new system"
                onChange={(e) => update(index, { when: e.target.value })}
              />
            </label>
          ) : null}
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => setRows((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : [{ ...EMPTY }]))}
          >
            Remove
          </button>
        </fieldset>
      ))}
      <div className={styles.transferActions}>
        {rows.length < MAX ? (
          <button type="button" className={styles.linkButton} onClick={() => setRows((current) => [...current, { ...EMPTY }])}>
            + Add a number
          </button>
        ) : null}
        <button type="button" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save transfer numbers'}
        </button>
      </div>
      {status ? (
        <p className={status.kind === 'ok' ? styles.saveOk : styles.actionError} role="status">
          {status.text}
        </p>
      ) : null}
      <small className={styles.muted}>
        {live
          ? 'Ava briefs the person who answers in one sentence, then connects the caller. If nobody answers, she takes a message.'
          : 'These are saved now and used once your own receptionist is live.'}{' '}
        Leave every phone blank and save to turn live transfer off.
      </small>
    </div>
  );
}
