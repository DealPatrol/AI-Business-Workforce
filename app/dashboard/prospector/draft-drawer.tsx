'use client';

import { useEffect, useState } from 'react';
import { draftKindLabel, leadStatusLabel, LEAD_STATUSES, type LeadStatus, type ProspectorDraft, type ProspectorLead, type ProspectorSend } from '@/lib/prospector/types';
import { prospectorRequest } from './api';
import styles from './prospector.module.css';

type Detail = {
  lead: ProspectorLead;
  drafts: ProspectorDraft[];
  sends: ProspectorSend[];
};

export default function DraftDrawer({
  leadId,
  sendReady,
  onClose,
  onLead,
}: {
  leadId: string;
  sendReady: boolean;
  onClose: () => void;
  onLead: (lead: ProspectorLead) => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [dirty, setDirty] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    prospectorRequest<Detail>(`/api/prospector/leads/${leadId}`, undefined, 'GET')
      .then((next) => {
        if (cancelled) return;
        setDetail(next);
        setToEmail(next.lead.emails[0] ?? '');
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      });
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  async function run(label: string, task: () => Promise<void>) {
    setBusy(label);
    setError('');
    setNotice('');
    try {
      await task();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Request failed.');
    } finally {
      setBusy('');
    }
  }

  async function changeStatus(status: LeadStatus) {
    if (!detail) return;
    await run('status', async () => {
      const result = await prospectorRequest<{ lead: ProspectorLead }>('/api/prospector/leads', { id: detail.lead.id, status }, 'PATCH');
      if (!result.lead) return;
      setDetail({ ...detail, lead: result.lead });
      onLead(result.lead);
    });
  }

  async function generate() {
    if (!detail) return;
    await run('draft', async () => {
      const result = await prospectorRequest<{ drafts: ProspectorDraft[]; lead: ProspectorLead }>('/api/prospector/drafts', {
        leadId: detail.lead.id,
      });
      setDetail({ ...detail, drafts: result.drafts, lead: result.lead ?? detail.lead });
      if (result.lead) onLead(result.lead);
      setNotice('Drafts are saved. Nothing sends until you approve a draft.');
    });
  }

  async function writeDraft(form: HTMLFormElement, action: 'save' | 'approve') {
    const data = new FormData(form);
    const id = String(data.get('id') ?? '');
    await run(action, async () => {
      const result = await prospectorRequest<{ drafts: ProspectorDraft[]; lead: ProspectorLead }>('/api/prospector/drafts', {
        id,
        action,
        subject: String(data.get('subject') ?? ''),
        body: String(data.get('body') ?? ''),
      }, 'PATCH');
      setDetail((current) => current ? { ...current, drafts: result.drafts, lead: result.lead ?? current.lead } : current);
      setDirty((current) => ({ ...current, [id]: false }));
      if (result.lead) onLead(result.lead);
      setNotice(action === 'approve' ? 'Draft approved. You can send it now.' : 'Draft saved. Approval was cleared.');
    });
  }

  async function sendDraft(draft: ProspectorDraft) {
    await run('send', async () => {
      const result = await prospectorRequest<{ send: ProspectorSend; lead: ProspectorLead; alreadySent: boolean }>('/api/prospector/send', {
        draftId: draft.id,
        toEmail,
      });
      setNotice(result.alreadySent ? `Already sent to ${result.send.toEmail}.` : `Sent to ${result.send.toEmail}.`);
      const refreshed = await prospectorRequest<Detail>(`/api/prospector/leads/${leadId}`, undefined, 'GET');
      setDetail(refreshed);
      onLead(refreshed.lead);
    });
  }

  async function copyForm(form: HTMLFormElement) {
    const data = new FormData(form);
    const text = `${String(data.get('subject') ?? '')}\n\n${String(data.get('body') ?? '')}\n\n--\nA physical-address footer and unsubscribe link are added automatically when this sends.`;
    await navigator.clipboard.writeText(text);
    setNotice('Email copied.');
  }

  const lead = detail?.lead;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <aside className={styles.drawer} onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Lead email">
        <div className={styles.headerActions}>
          <button className={styles.ghost} type="button" onClick={onClose}>Close</button>
        </div>
        {!lead ? <p className={styles.quiet}>{error || 'Loading lead…'}</p> : (
          <>
            <h2>{lead.name}</h2>
            <p className={styles.quiet}>
              {lead.category || 'Uncategorized'} · {lead.address || 'No address'}
              {lead.rating != null ? ` · ${lead.rating} stars (${lead.reviewCount ?? 0} reviews)` : ''}
            </p>
            <p className={styles.quiet}>
              {lead.phone ? <a href={`tel:${lead.phone}`}>{lead.phone}</a> : 'No phone'}
              {lead.website ? <> · <a href={lead.website} target="_blank" rel="noreferrer">Website</a></> : null}
              {lead.mapsUrl ? <> · <a href={lead.mapsUrl} target="_blank" rel="noreferrer">Maps</a></> : null}
            </p>
            {lead.contactName && <p className={styles.quiet}>Contact name found on the site: {lead.contactName}</p>}
            <label>
              Status
              <select value={lead.status} onChange={(event) => changeStatus(event.target.value as LeadStatus)}>
                {LEAD_STATUSES.map((status) => <option key={status} value={status}>{leadStatusLabel(status)}</option>)}
              </select>
            </label>
            <p className={styles.quiet}>Marking do-not-contact adds every found email to the suppression list. Sending checks that list first.</p>
            {lead.emails.length > 0 ? (
              <label>
                Send to
                <select value={toEmail} onChange={(event) => setToEmail(event.target.value)}>
                  {lead.emails.map((email) => <option key={email} value={email}>{email}</option>)}
                </select>
              </label>
            ) : (
              <p className={styles.info}>No public email yet. This lead stays call-only until an address is found. The phone number is still useful.</p>
            )}
            <div className={styles.formActions}>
              <button className={styles.secondary} type="button" disabled={Boolean(busy) || lead.status === 'do_not_contact'} onClick={generate}>
                {busy === 'draft' ? 'Writing…' : 'Write first email and follow-ups'}
              </button>
            </div>
            {error && <p className={styles.alert} role="alert">{error}</p>}
            {notice && <p className={styles.info}>{notice}</p>}
            {detail?.drafts.map((draft) => (
              <form
                className={styles.draft}
                key={`${draft.id}:${draft.approvedAt ?? ''}:${draft.body}`}
                onSubmit={(event) => {
                  event.preventDefault();
                  void writeDraft(event.currentTarget, 'save');
                }}
                onInput={() => setDirty((current) => ({ ...current, [draft.id]: true }))}
              >
                <input type="hidden" name="id" value={draft.id} />
                <div className={styles.targetHead}>
                  <b>{draftKindLabel(draft.kind)}</b>
                  <span className={draft.approvedAt && !dirty[draft.id] ? styles.email : styles.pill}>
                    {draft.approvedAt && !dirty[draft.id] ? 'Approved' : 'Needs approval'}
                  </span>
                </div>
                <label>
                  Subject
                  <input name="subject" defaultValue={draft.subject} />
                </label>
                <label>
                  Body
                  <textarea name="body" defaultValue={draft.body} />
                </label>
                <div className={styles.draftActions}>
                  <button className={styles.ghost} type="submit" disabled={Boolean(busy)}>Save</button>
                  <button
                    className={styles.secondary}
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={(event) => {
                      const form = event.currentTarget.closest('form');
                      if (form) void writeDraft(form, 'approve');
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className={styles.ghost}
                    type="button"
                    onClick={(event) => {
                      const form = event.currentTarget.closest('form');
                      if (form) void copyForm(form);
                    }}
                  >
                    Copy
                  </button>
                  <button
                    className={styles.primary}
                    type="button"
                    disabled={Boolean(busy) || !draft.approvedAt || dirty[draft.id] || !sendReady || lead.emails.length === 0}
                    onClick={() => sendDraft(draft)}
                  >
                    Send
                  </button>
                </div>
                {!sendReady && <p className={styles.quiet}>Cold email is off, or the unsubscribe secret is missing, so this draft can be copied or exported but not sent.</p>}
              </form>
            ))}
            {detail && detail.sends.length > 0 && (
              <div className={styles.log}>
                <b>Send log</b>
                <ul>
                  {detail.sends.map((send) => (
                    <li key={send.id}>
                      {send.status} · {send.toEmail} · {send.subject}
                      {send.error ? ` · ${send.error}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
