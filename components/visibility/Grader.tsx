'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import styles from './visibility.module.css';

type Check = {
  id: string;
  group: 'facts' | 'search' | 'ai' | 'technical';
  label: string;
  status: 'pass' | 'warn' | 'fail';
  found: string;
  fix: string;
  items?: Array<{ label: string; ok: boolean }>;
};

type Report = {
  checkedAt: string;
  input: { website: string; trade: string; city: string };
  finalUrl: string;
  score: number;
  grade: string;
  checks: Check[];
  fixes: Array<{ id: string; label: string; fix: string }>;
  facts: { name: string | null; phones: string[]; address: string | null; email: string | null; hours: boolean; socials: string[]; schemaTypes: string[] };
  method: string[];
};

type AiRecord = { engine: string; model: string; prompt: string; location: string; checkedAt: string; mentioned: boolean; citedDomains: string[] };

type Result = {
  report: Report;
  ai: { status: 'off' | 'done' | 'error'; records: AiRecord[]; note: string };
  competitors: { status: string; source: string | null; list: Array<{ name: string; rating: number | null; reviews: number | null }> };
  delivery: { saved: boolean; notified: boolean; emailed: boolean };
};

const TRADES = [
  'Dentist / dental office',
  'Law firm / attorney',
  'Hair salon / barber',
  'Auto repair',
  'Med spa',
  'Real estate agent',
  'Restaurant',
  'Chiropractor',
  'Veterinarian',
  'Accountant / CPA',
  'Insurance agency',
  'Gym / fitness',
  'HVAC / heating & air',
  'Plumbing',
  'Roofing',
  'Lawn care / landscaping',
  'House cleaning',
  'Electrical',
  'Pest control',
  'Pressure washing',
  'Painting',
  'Garage doors',
  'Tree service',
  'Pool service',
];

const GROUPS: Array<{ key: Check['group']; title: string }> = [
  { key: 'facts', title: 'Business facts' },
  { key: 'search', title: 'Search basics' },
  { key: 'ai', title: 'AI readiness' },
  { key: 'technical', title: 'Technical' },
];

const STATUS_TEXT = { pass: 'Good', warn: 'Could be better', fail: 'Missing' } as const;

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return date.toUTCString();
  }
}

function StatusMark({ status }: { status: Check['status'] }) {
  return (
    <span className={`${styles.mark} ${styles[`mark_${status}`]}`} aria-hidden="true">
      {status === 'pass' ? '✓' : status === 'warn' ? '!' : '×'}
    </span>
  );
}

export function Grader() {
  const formId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/grader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const data = (await response.json().catch(() => ({}))) as Partial<Result> & { error?: string };
      if (!response.ok || !data.report) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setResult(data as Result);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch {
      setError('We could not reach the grader. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  const report = result?.report;
  const checkedDate = report ? formatWhen(report.checkedAt) : '';

  return (
    <div className={styles.graderWrap}>
      <form className={styles.form} onSubmit={onSubmit} aria-describedby={`${formId}-note`} noValidate={false}>
        <div className={styles.field}>
          <label htmlFor={`${formId}-website`}>Your website</label>
          <input id={`${formId}-website`} name="website" type="text" inputMode="url" autoComplete="url" placeholder="yourbusiness.com" required maxLength={300} />
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor={`${formId}-trade`}>Type of business</label>
            <input id={`${formId}-trade`} name="trade" list={`${formId}-trades`} placeholder="Dentist, law firm, salon, HVAC…" required maxLength={60} />
            <datalist id={`${formId}-trades`}>
              {TRADES.map((trade) => (
                <option key={trade} value={trade} />
              ))}
            </datalist>
          </div>
          <div className={styles.field}>
            <label htmlFor={`${formId}-city`}>Main city you serve</label>
            <input id={`${formId}-city`} name="city" autoComplete="address-level2" placeholder="Cullman, AL" required maxLength={80} />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${formId}-email`}>Email for your full report</label>
          <input id={`${formId}-email`} name="email" type="email" autoComplete="email" placeholder="you@yourbusiness.com" required maxLength={254} />
        </div>
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor={`${formId}-company-site`}>Leave this empty</label>
          <input id={`${formId}-company-site`} name="company_site" tabIndex={-1} autoComplete="off" />
        </div>
        <button className={styles.primary} type="submit" disabled={busy} aria-busy={busy}>
          {busy ? 'Checking your site…' : 'Grade my site free'}
        </button>
        <p id={`${formId}-note`} className={styles.formNote}>
          Takes about 15 seconds. We read your page like a search engine does. No card, no sales call. We email you a copy and may follow up once.
        </p>
      </form>

      <div aria-live="polite" className={styles.liveRegion}>
        {busy ? <p className={styles.loading}>Reading your page, robots.txt, and sitemap…</p> : null}
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {report && result ? (
        <div className={styles.report} ref={resultRef} tabIndex={-1} aria-label="Your visibility report">
          <div className={styles.reportHead}>
            <div className={styles.scoreRing} style={{ ['--score' as string]: report.score }}>
              <b>{report.score}</b>
              <small>/100</small>
            </div>
            <div>
              <span className={styles.eyebrow}>YOUR REAL RESULTS</span>
              <h3>
                {report.grade}: {report.facts.name || new URL(report.finalUrl).hostname}
              </h3>
              <p className={styles.muted}>
                {report.input.trade} · {report.input.city} · checked {checkedDate}
              </p>
            </div>
          </div>

          {report.fixes.length ? (
            <section className={styles.fixes} aria-labelledby={`${formId}-fixes`}>
              <h4 id={`${formId}-fixes`}>Fix these first</h4>
              <ol>
                {report.fixes.slice(0, 5).map((fix) => (
                  <li key={fix.id}>
                    <b>{fix.label}</b>
                    <span>{fix.fix}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <p className={styles.good}>Nothing urgent on this page. Nice work.</p>
          )}

          <section className={styles.aiBox} aria-labelledby={`${formId}-ai`}>
            <h4 id={`${formId}-ai`}>AI recommendation check</h4>
            {result.ai.status === 'done' && result.ai.records.length ? (
              <>
                <p className={styles.muted}>{result.ai.note}</p>
                <ul className={styles.aiList}>
                  {result.ai.records.map((record) => (
                    <li key={record.prompt}>
                      <StatusMark status={record.mentioned ? 'pass' : 'fail'} />
                      <span>
                        <b>“{record.prompt}”</b> {record.mentioned ? 'Your business was mentioned.' : 'Your business was not mentioned.'}
                        <small>
                          {record.engine} ({record.model}) · {record.location} · {formatWhen(record.checkedAt)}
                        </small>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>
                We have not asked the AI assistants about you yet. We will run real checks, asking the questions your customers ask, and
                email your results with the engine, question, location, and date for every answer. We never show a made-up result.
              </p>
            )}
          </section>

          {result.competitors.list.length ? (
            <section className={styles.aiBox}>
              <h4>Businesses showing up near you</h4>
              <p className={styles.muted}>Source: {result.competitors.source}</p>
              <ul className={styles.compList}>
                {result.competitors.list.map((c) => (
                  <li key={c.name}>
                    {c.name}
                    {c.rating ? ` · ${c.rating}★ (${c.reviews ?? 0} reviews)` : ''}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby={`${formId}-facts`}>
            <h4 id={`${formId}-facts`}>Business facts we could read</h4>
            <dl className={styles.facts}>
              <div>
                <dt>Name</dt>
                <dd>{report.facts.name || 'Not found'}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{report.facts.phones.join(', ') || 'Not found'}</dd>
              </div>
              <div>
                <dt>Address / area</dt>
                <dd>{report.facts.address || 'Not found'}</dd>
              </div>
              <div>
                <dt>Hours</dt>
                <dd>{report.facts.hours ? 'Listed' : 'Not found'}</dd>
              </div>
              <div>
                <dt>Profiles linked</dt>
                <dd>{report.facts.socials.join(', ') || 'None found'}</dd>
              </div>
              <div>
                <dt>Schema</dt>
                <dd>{report.facts.schemaTypes.join(', ') || 'None found'}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby={`${formId}-all`}>
            <h4 id={`${formId}-all`}>Everything we checked</h4>
            <div className={styles.groups}>
              {GROUPS.map((group) => (
                <div key={group.key} className={styles.group}>
                  <h5>{group.title}</h5>
                  <ul>
                    {report.checks
                      .filter((check) => check.group === group.key)
                      .map((check) => (
                        <li key={check.id}>
                          <StatusMark status={check.status} />
                          <div>
                            <b>
                              {check.label} <span className={styles.srOnly}>: {STATUS_TEXT[check.status]}</span>
                            </b>
                            <span>{check.found}</span>
                            {check.items ? (
                              <ul className={styles.subItems}>
                                {check.items.map((item) => (
                                  <li key={item.label}>
                                    <span aria-hidden="true">{item.ok ? '✓' : '–'}</span> {item.label}
                                    <span className={styles.srOnly}>{item.ok ? ' (covered)' : ' (missing)'}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <p className={styles.method}>
            {report.method.join(' ')} No one can promise a ranking or an AI recommendation; this shows what we found and what tends to help.
          </p>
          <p className={styles.delivery}>
            {result.delivery.emailed
              ? 'We emailed you a copy of this report.'
              : result.delivery.saved || result.delivery.notified
                ? 'We saved your report and Cole will email you a copy.'
                : 'We could not save a copy just now. Screenshot this page, or email hello@frontporchgrowth.com and we will run it for you.'}{' '}
            Want help with the fixes? <a href="mailto:hello@frontporchgrowth.com?subject=Help%20with%20my%20visibility%20report">Email hello@frontporchgrowth.com</a>.
          </p>
        </div>
      ) : null}
    </div>
  );
}
