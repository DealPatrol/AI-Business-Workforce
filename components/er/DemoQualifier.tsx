'use client';

import { FormEvent, useMemo, useState } from 'react';
import { AVA_PLANS } from '@/lib/ava/pricing';
import { GBP_BUNDLES, GBP_CARE, usd } from '@/lib/ava/gbp-packages';
import { qualify, type GbpState } from '@/lib/ava/demo-qualifier';
import { formatUsd } from '@/lib/ava/missed-call-math';
import styles from './editorial.module.css';

const CONTACT_EMAIL = 'colecollins763@gmail.com';
const TRADES = ['HVAC', 'Plumbing', 'Roofing', 'Electrical', 'Landscaping / lawn care', 'Pest control', 'Garage doors', 'General contractor', 'Other'];

function packageOptions() {
  return [
    ...GBP_BUNDLES.map((b) => `${b.label} bundle (${usd(b.monthlyCents)}/mo)`),
    ...Object.values(AVA_PLANS).map((p) => `Ava ${p.label} only (${p.monthlyLabel}/mo)`),
    `${GBP_CARE.care.label} only (${GBP_CARE.care.monthlyLabel})`,
    'Not sure yet',
  ];
}

function mailto(data: FormData) {
  const subject = encodeURIComponent(`Ava demo request: ${String(data.get('business') || 'New shop')}`);
  const body = encodeURIComponent(
    ['business', 'contact', 'email', 'phone', 'industry', 'serviceArea', 'interest', 'preferredTime', 'qualifier', 'notes']
      .map((key) => `${key}: ${String(data.get(key) || '')}`)
      .join('\n'),
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export function DemoQualifier({ initialPackage, bookingUrl }: { initialPackage?: string; bookingUrl?: string }) {
  const [callsPerWeek, setCalls] = useState(30);
  const [missedPercent, setMissed] = useState(25);
  const [minutesPerCall, setMinutes] = useState(3);
  const [jobValue, setJobValue] = useState(350);
  const [oneIn, setOneIn] = useState(4);
  const [gbp, setGbp] = useState<GbpState>('thin');
  const [trade, setTrade] = useState('HVAC');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const result = useMemo(
    () => qualify({ callsPerWeek, missedPercent, minutesPerCall, jobValue, oneIn, gbp }),
    [callsPerWeek, missedPercent, minutesPerCall, jobValue, oneIn, gbp],
  );
  const options = packageOptions();
  const recommended = result.bundle
    ? `${result.bundle.label} bundle (${usd(result.bundle.monthlyCents)}/mo)`
    : `Ava ${AVA_PLANS[result.plan].label} only (${AVA_PLANS[result.plan].monthlyLabel}/mo)`;
  const preselected = options.find((o) => initialPackage && o.toLowerCase().includes(initialPackage.toLowerCase())) || recommended;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/ava/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (body.emailFallback) {
          window.location.href = mailto(data);
          setStatus('idle');
          return;
        }
        throw new Error(body.error || 'Could not send. Call or text (256) 595-3354.');
      }
      setStatus('sent');
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send. Call or text (256) 595-3354.');
      setStatus('idle');
    }
  }

  const num = (setter: (n: number) => void) => (e: { target: { value: string } }) => setter(Number(e.target.value));

  return (
    <div>
      <div className={styles.form} aria-label="Package qualifier">
        <div className={styles.formRow}>
          <label className={styles.field}>
            Your trade
            <select value={trade} onChange={(e) => setTrade(e.target.value)}>
              {TRADES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            Calls in a normal week
            <input type="number" min={0} max={2000} value={callsPerWeek} onChange={num(setCalls)} />
          </label>
          <label className={styles.field}>
            Share you miss or send to voicemail (%)
            <input type="number" min={0} max={100} value={missedPercent} onChange={num(setMissed)} />
          </label>
        </div>
        <div className={styles.formRow}>
          <label className={styles.field}>
            Minutes per call (guess)
            <input type="number" min={1} max={30} value={minutesPerCall} onChange={num(setMinutes)} />
          </label>
          <label className={styles.field}>
            Typical job value ($)
            <input type="number" min={0} max={100000} value={jobValue} onChange={num(setJobValue)} />
          </label>
          <label className={styles.field}>
            1 in how many callers books?
            <input type="number" min={1} max={100} value={oneIn} onChange={num(setOneIn)} />
          </label>
          <label className={styles.field}>
            Your Google Business Profile today
            <select value={gbp} onChange={(e) => setGbp(e.target.value as GbpState)}>
              <option value="none">Don’t have one / not sure</option>
              <option value="thin">Have one, rarely touch it</option>
              <option value="good">Complete and updated weekly</option>
            </select>
          </label>
        </div>
        <div className={styles.result} aria-live="polite">
          <h3>Your fit: {result.bundle ? `${result.bundle.label} bundle` : `Ava ${AVA_PLANS[result.plan].label}`}</h3>
          <p style={{ margin: 0 }}>{result.summary}</p>
          <p className={styles.note} style={{ marginTop: 8 }}>
            Missed calls in your numbers: about {formatUsd(result.monthlyExample)} a month.
          </p>
        </div>
      </div>

      {status === 'sent' ? (
        <div className={styles.result} style={{ marginTop: 20 }}>
          <h3>Request sent.</h3>
          <p style={{ margin: 0 }}>
            Cole will email or call you to confirm a demo time (Central time). Meanwhile, call the demo line at (256) 952-4935 to
            hear Ava now.
          </p>
        </div>
      ) : (
        <form className={styles.form} onSubmit={submit} style={{ marginTop: 20 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--er-serif, Georgia, serif)', fontSize: 28 }}>Book a 15-minute demo</h3>
          <p className={styles.note}>
            A short call with Cole Collins: you hear Ava answer as a shop in your trade, and he looks over your Google profile
            with you. No card needed to book.
          </p>
          <div className={styles.formRow}>
            <label className={styles.field}>
              Business name
              <input name="business" required autoComplete="organization" />
            </label>
            <label className={styles.field}>
              Your name
              <input name="contact" required autoComplete="name" />
            </label>
          </div>
          <div className={styles.formRow}>
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
              Town or service area
              <input name="serviceArea" placeholder="Cullman, Huntsville, Tuscaloosa…" />
            </label>
            <label className={styles.field}>
              Best time for the demo (Central)
              <select name="preferredTime" defaultValue="Weekday morning">
                <option>Weekday morning</option>
                <option>Weekday lunch</option>
                <option>Weekday afternoon</option>
                <option>Weekday evening</option>
                <option>Saturday</option>
              </select>
            </label>
          </div>
          <label className={styles.field}>
            Package you’re looking at
            <select name="interest" key={preselected} defaultValue={preselected}>
              {options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            Anything Ava should know (optional)
            <textarea name="notes" />
          </label>
          <input type="hidden" name="industry" value={trade} />
          <input type="hidden" name="qualifier" value={`${result.summary} Lead read: ${result.heat}.`} />
          <label className={styles.honeypot} aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.ctaRow} style={{ marginTop: 0 }}>
            <button className={styles.btnInk} type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Request my demo'}
            </button>
            {bookingUrl ? (
              <a className={styles.btnGhost} href={bookingUrl} target="_blank" rel="noopener noreferrer">
                Or pick a time on Cole’s calendar
              </a>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}
