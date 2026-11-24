'use client';

import { useState, type FormEvent } from 'react';
import { GBP_BUNDLES, GBP_CARE, usd } from '@/lib/ava/gbp-packages';
import styles from '@/components/er/editorial.module.css';

const CONTACT = 'hello@frontporchgrowth.com';

const OPTIONS = [
  `${GBP_CARE.care.label} (${GBP_CARE.care.monthlyLabel})`,
  `${GBP_CARE.carePlus.label} (${GBP_CARE.carePlus.monthlyLabel})`,
  ...GBP_BUNDLES.map((b) => `${b.label} bundle with Ava (${usd(b.monthlyCents)}/mo)`),
  'Free profile check first',
];

/** Google profile care request. Posts to the existing /api/fpg/gap-report route (existing Resend key); mailto fallback. */
export function ProfileCareForm({ source }: { source: string }) {
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
      interest: `Google profile care: ${value('tier')} (${source})`,
      notes: `Google profile link: ${value('profile') || 'not given'}`,
      website: value('company_site'),
    };
    const mailto = `mailto:${CONTACT}?subject=${encodeURIComponent(`Google profile care request: ${body.business}`)}&body=${encodeURIComponent(
      Object.entries(body)
        .filter(([key]) => key !== 'website')
        .map(([key, val]) => `${key}: ${val}`)
        .join('\n'),
    )}`;
    setState('sending');
    try {
      const res = await fetch('/api/fpg/gap-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setState('sent');
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (json.emailFallback) {
        window.location.href = mailto;
        setState('idle');
        return;
      }
      setFallback(json.error || 'Could not send.');
      setState('error');
    } catch {
      setFallback('Could not send.');
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div className={styles.result}>
        <h3>Got it.</h3>
        <p style={{ margin: 0 }}>Cole will look at your profile and reply by email, usually within one business day.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.formRow}>
        <label className={styles.field}>
          Business name
          <input name="business" required autoComplete="organization" />
        </label>
        <label className={styles.field}>
          Trade
          <input name="trade" placeholder="HVAC, plumbing, roofing…" />
        </label>
        <label className={styles.field}>
          Towns you serve
          <input name="towns" placeholder="Cullman, Hanceville…" />
        </label>
      </div>
      <div className={styles.formRow}>
        <label className={styles.field}>
          Your name
          <input name="contact" required autoComplete="name" />
        </label>
        <label className={styles.field}>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className={styles.field}>
          Phone
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
      </div>
      <div className={styles.formRow}>
        <label className={styles.field}>
          Plan
          <select name="tier" defaultValue={OPTIONS[0]}>
            {OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Google profile or Maps link (optional)
          <input name="profile" type="url" placeholder="https://maps.app.goo.gl/…" />
        </label>
      </div>
      <label className={styles.honeypot} aria-hidden="true">
        Company site
        <input name="company_site" tabIndex={-1} autoComplete="off" />
      </label>
      {state === 'error' ? <p className={styles.error}>{fallback} Email {CONTACT}.</p> : null}
      <div className={styles.ctaRow} style={{ marginTop: 0 }}>
        <button className={styles.btnInk} type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Request profile care'}
        </button>
      </div>
      <p className={styles.note}>No card now. Cole confirms the plan and sends the billing link by email.</p>
    </form>
  );
}
