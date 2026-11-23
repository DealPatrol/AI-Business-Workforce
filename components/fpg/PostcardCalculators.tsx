'use client';

import { useState } from 'react';
import styles from './fpg.module.css';
import { POSTCARD_MAX_QUANTITY, POSTCARD_MIN_QUANTITY, POSTCARD_SETUP_CENTS, POSTCARD_SIZES, type PostcardSize } from '@/lib/postcards/pricing';

/** USPS EDDM Retail postage per piece, Notice 123 effective Oct 4, 2026 (checked Nov 22, 2026). */
const EDDM_RETAIL_CENTS = 26;

function money(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function clampQty(value: number) {
  if (!Number.isFinite(value)) return POSTCARD_MIN_QUANTITY;
  return Math.min(POSTCARD_MAX_QUANTITY, Math.max(POSTCARD_MIN_QUANTITY, Math.round(value)));
}

export function PostcardCostCalculator() {
  const [qty, setQty] = useState(250);
  const [size, setSize] = useState<PostcardSize>('4x6');
  const [hasSetup, setHasSetup] = useState(false);
  const q = clampQty(qty);
  const unit = POSTCARD_SIZES[size].unitCents;
  const setup = hasSetup ? 0 : POSTCARD_SETUP_CENTS;
  const total = setup + q * unit;
  const eddm = q * EDDM_RETAIL_CENTS;
  return (
    <div className={styles.calc}>
      <label>
        How many cards? ({POSTCARD_MIN_QUANTITY}–{POSTCARD_MAX_QUANTITY.toLocaleString('en-US')})
        <input type="number" min={POSTCARD_MIN_QUANTITY} max={POSTCARD_MAX_QUANTITY} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
      </label>
      <label>
        Card size
        <select value={size} onChange={(e) => setSize(e.target.value as PostcardSize)}>
          {Object.values(POSTCARD_SIZES).map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} ({s.unitLabel} per card)
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="checkbox" checked={hasSetup} onChange={(e) => setHasSetup(e.target.checked)} style={{ minHeight: 0 }} />
        I already paid the one-time setup
      </label>
      <div className={styles.result} aria-live="polite">
        YardMailer total: <strong>{money(total)}</strong>
        <br />
        {money(total / q)} per card, all in (printing, postage and mailing).
      </div>
      <p className={styles.formula}>
        = {hasSetup ? '$0' : money(POSTCARD_SETUP_CENTS)} setup + {q.toLocaleString('en-US')} × {money(unit)}
      </p>
      <p className={styles.fine}>
        For reference, USPS Every Door Direct Mail Retail postage alone on {q.toLocaleString('en-US')} pieces would be {money(eddm)} ({q.toLocaleString('en-US')} × $0.260), before
        design, printing and drop-off, and only for pieces that meet USPS flat-size rules (200 minimum per ZIP Code per day).
      </p>
    </div>
  );
}

export function PostcardBreakEvenCalculator() {
  const [qty, setQty] = useState(250);
  const [size, setSize] = useState<PostcardSize>('4x6');
  const [jobValue, setJobValue] = useState(1500);
  const [margin, setMargin] = useState(40);
  const q = clampQty(qty);
  const cost = POSTCARD_SETUP_CENTS + q * POSTCARD_SIZES[size].unitCents;
  const grossPerJob = Math.max(0, jobValue) * (Math.min(100, Math.max(0, margin)) / 100) * 100;
  const jobs = grossPerJob > 0 ? Math.ceil(cost / grossPerJob) : null;
  const rate = jobs ? (jobs / q) * 100 : null;
  return (
    <div className={styles.calc}>
      <label>
        Cards mailed
        <input type="number" min={POSTCARD_MIN_QUANTITY} max={POSTCARD_MAX_QUANTITY} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
      </label>
      <label>
        Card size
        <select value={size} onChange={(e) => setSize(e.target.value as PostcardSize)}>
          {Object.values(POSTCARD_SIZES).map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} ({s.unitLabel} per card)
            </option>
          ))}
        </select>
      </label>
      <label>
        Average job value ($)
        <input type="number" min={0} value={jobValue} onChange={(e) => setJobValue(Number(e.target.value))} />
      </label>
      <label>
        Your gross margin on that job (%)
        <input type="number" min={0} max={100} value={margin} onChange={(e) => setMargin(Number(e.target.value))} />
      </label>
      <div className={styles.result} aria-live="polite">
        {jobs ? (
          <>
            Break even at <strong>{jobs} job{jobs === 1 ? '' : 's'}</strong> from {q.toLocaleString('en-US')} cards.
            <br />
            That is {rate!.toFixed(2)}% of the cards turning into a job.
          </>
        ) : (
          'Enter a job value and margin above zero.'
        )}
      </div>
      <p className={styles.formula}>
        jobs = ceil( {money(cost)} mailing cost ÷ ({money(jobValue * 100)} × {margin}% margin) )
      </p>
      <p className={styles.fine}>
        This is arithmetic on your own numbers, not a prediction. Response rates vary by trade, list, offer and season, and nobody can promise one.
        Mailing cost uses the {money(POSTCARD_SETUP_CENTS)} first-order setup.
      </p>
    </div>
  );
}
