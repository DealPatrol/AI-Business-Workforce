'use client';

import { useId, useState, type FormEvent } from 'react';
import styles from './visibility.module.css';

const CONTACT = 'hello@frontporchgrowth.com';

/**
 * Free Competitor Gap Report request. Posts to /api/fpg/gap-report, which emails Cole using the existing Resend key. If online delivery is not configured, it falls back to a prefilled email.
 */
export function GapReportForm({ source }: { source: string }) {
  const id = useId();
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [fallback, setFallback] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? '').trim();
    const body = {
      business: value('business'),
      contact: value('contact'),
      email: value('email'),
      phone: value('phone'),
      industry: value('trade'),
      serviceArea: value('towns'),
      interest: `AI Visibility Gap Report (${source})`,
      notes: `Website: ${value('site') || 'not given'}`,
      website: value('company_site'),
    };
    const mailto = `mailto:${CONTACT}?subject=${encodeURIComponent(`Competitor Gap Report request (${source})`)}&body=${encodeURIComponent(
      `Business name: ${body.business}\nWebsite: ${value('site')}\nTowns: ${body.serviceArea}\nTrade: ${body.industry}\nName: ${body.contact}\nPhone: ${body.phone}\nEmail: ${body.email}\n`,
    )}`;
    setState('sending');
    try {
      const res = await fetch('/api/fpg/gap-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setState('sent');
        return;
      }
      setFallback(mailto);
      setState('error');
    } catch {
      setFallback(mailto);
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div className={styles.form} role="status">
        <p style={{ margin: 0, fontWeight: 700 }}>Got it. Cole will email your Gap Report to the address you gave.</p>
        <p className={styles.formNote}>Nothing is billed. The report is yours to keep whether or not you hire us.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor={`${id}-business`}>Business name</label>
          <input id={`${id}-business`} name="business" required maxLength={120} autoComplete="organization" />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-site`}>Website (if you have one)</label>
          <input id={`${id}-site`} name="site" maxLength={300} inputMode="url" placeholder="yourbusiness.com" />
        </div>
      </div>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor={`${id}-trade`}>Trade</label>
          <input id={`${id}-trade`} name="trade" maxLength={60} placeholder="HVAC, plumbing, roofing, electrical…" />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-towns`}>Towns you serve</label>
          <input id={`${id}-towns`} name="towns" maxLength={160} placeholder="Cullman, Hanceville" />
        </div>
      </div>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor={`${id}-contact`}>Your name</label>
          <input id={`${id}-contact`} name="contact" required maxLength={120} autoComplete="name" />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-email`}>Email for the report</label>
          <input id={`${id}-email`} name="email" type="email" required maxLength={254} autoComplete="email" />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor={`${id}-phone`}>Phone (optional)</label>
        <input id={`${id}-phone`} name="phone" type="tel" maxLength={40} autoComplete="tel" />
      </div>
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={`${id}-company-site`}>Leave this empty</label>
        <input id={`${id}-company-site`} name="company_site" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" className={styles.primary} disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Request my free Gap Report'}
      </button>
      {state === 'error' ? (
        <p className={styles.error} role="alert">
          The form could not send right now. <a href={fallback}>Email the same details to {CONTACT}</a> instead.
        </p>
      ) : null}
      <p className={styles.formNote}>Free, no card. We use these details only to prepare and send your report.</p>
    </form>
  );
}
