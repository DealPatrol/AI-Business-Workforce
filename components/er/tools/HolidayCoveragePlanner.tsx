'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CARRIERS } from '@/lib/er/tools';
import { HOLIDAYS_2026, buildHolidayPlan } from '@/lib/er/holiday-coverage';
import styles from '../er-site.module.css';

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={styles.btnLight}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1800);
        });
      }}
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

export function HolidayCoveragePlanner() {
  const [shop, setShop] = useState('');
  const [closedIds, setClosedIds] = useState<string[]>(['christmas', 'new-years-day']);
  const [reopen, setReopen] = useState('Monday, December 28');
  const [urgentMeans, setUrgentMeans] = useState('no heat, no water, or water leaking');
  const [carrier, setCarrier] = useState(CARRIERS[0].carrier);
  const [forwardTo, setForwardTo] = useState('');
  const [safetyLine, setSafetyLine] = useState(true);

  const plan = useMemo(
    () => buildHolidayPlan({ shop, closedIds, reopen, urgentMeans, carrier, forwardTo, safetyLine }),
    [shop, closedIds, reopen, urgentMeans, carrier, forwardTo, safetyLine],
  );

  const toggle = (id: string) => setClosedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <div className={styles.tool}>
      <div className={styles.fields}>
        <label className={styles.field}>
          Shop name
          <input value={shop} placeholder="Porchlight Heating & Air" onChange={(e) => setShop(e.target.value)} />
        </label>
        <label className={styles.field}>
          Day you reopen
          <input value={reopen} onChange={(e) => setReopen(e.target.value)} />
        </label>
        <label className={styles.field}>
          What counts as urgent
          <input value={urgentMeans} onChange={(e) => setUrgentMeans(e.target.value)} />
        </label>
        <label className={styles.field}>
          Shop phone carrier
          <select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {CARRIERS.map((c) => (
              <option key={c.carrier} value={c.carrier}>
                {c.carrier}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Number to forward to (answering service or Ava)
          <input inputMode="tel" placeholder="(555) 555-5555" value={forwardTo} onChange={(e) => setForwardTo(e.target.value)} />
        </label>
      </div>
      <fieldset className={styles.field} style={{ border: 0, padding: 0 }}>
        <legend>Days you are closed</legend>
        {HOLIDAYS_2026.map((d) => (
          <label key={d.id} className={styles.fine} style={{ display: 'block' }}>
            <input type="checkbox" checked={closedIds.includes(d.id)} onChange={() => toggle(d.id)} /> {d.label}, {d.weekday} {d.date}
          </label>
        ))}
      </fieldset>
      <label className={styles.fine}>
        <input type="checkbox" checked={safetyLine} onChange={(e) => setSafetyLine(e.target.checked)} /> Add a gas and safety line
      </label>

      <h3>1. Your holiday greeting</h3>
      <p className={styles.output}>{plan.greeting}</p>
      <CopyButton text={plan.greeting} />

      <h3>2. Your holiday checklist</h3>
      <ol className={styles.list}>
        {plan.checklist.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {plan.carrierSteps.length ? (
        <>
          <p className={styles.note}>{carrier} does not publish dial codes. Its steps:</p>
          <ol className={styles.list}>
            {plan.carrierSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </>
      ) : null}
      {plan.carrierSource ? (
        <p className={styles.note}>
          Forwarding codes from <a href={plan.carrierSource.url} rel="noreferrer">{plan.carrierSource.label}</a>. Carriers change codes; their page is the
          final word. More options on the <Link href="/tools/call-forwarding-codes">call forwarding codes</Link> page.
        </p>
      ) : null}

      <h3>3. Notes for whoever answers</h3>
      <p className={styles.note}>Give these to your answering service, or to us at Ava setup, so holiday callers are handled the way you want.</p>
      <p className={styles.output}>{plan.receptionistNotes}</p>
      <CopyButton text={plan.receptionistNotes} />
      <p className={styles.note}>Nothing you type leaves your browser.</p>
    </div>
  );
}
