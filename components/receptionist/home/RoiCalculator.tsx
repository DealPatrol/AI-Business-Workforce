'use client';

import { useMemo, useState } from 'react';
import { formatUsd } from '@/lib/ava/missed-call-math';
import styles from './er-home.module.css';

/** Missed-call estimate from the visitor's own assumptions. Not a measured average. */
export function RoiCalculator() {
  const [missed, setMissed] = useState(10);
  const [bookRate, setBookRate] = useState(30);
  const [jobValue, setJobValue] = useState(350);
  const [open, setOpen] = useState(false);

  const result = useMemo(() => {
    const perWeek = (missed * bookRate) / 100;
    const monthly = Math.round(perWeek * jobValue * (52 / 12));
    return { perWeek, monthly, yearly: monthly * 12 };
  }, [missed, bookRate, jobValue]);

  return (
    <div className={styles.roi}>
      <div className={styles.roiInputs}>
        <label>
          <span>
            Missed calls per week <b>{missed}</b>
          </span>
          <input type="range" min={0} max={60} step={1} value={missed} onChange={(e) => setMissed(Number(e.target.value))} />
        </label>
        <label>
          <span>
            Average job value <b>{formatUsd(jobValue)}</b>
          </span>
          <input type="range" min={50} max={3000} step={25} value={jobValue} onChange={(e) => setJobValue(Number(e.target.value))} />
        </label>
        <button type="button" className={styles.roiToggle} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide assumption' : `Assuming ${bookRate}% of missed callers would have booked. Change`}
        </button>
        {open ? (
          <label>
            <span>
              Missed callers who would have booked <b>{bookRate}%</b>
            </span>
            <input type="range" min={5} max={80} step={5} value={bookRate} onChange={(e) => setBookRate(Number(e.target.value))} />
          </label>
        ) : null}
      </div>
      <div className={styles.roiResult} aria-live="polite">
        <p>Work that may be slipping away</p>
        <strong>{formatUsd(result.yearly)}</strong>
        <span>per year</span>
        <dl>
          <div>
            <dt>Monthly</dt>
            <dd>{formatUsd(result.monthly)}</dd>
          </div>
          <div>
            <dt>Jobs</dt>
            <dd>{result.perWeek.toFixed(1)} / week</dd>
          </div>
        </dl>
        <small>Your numbers, not an industry average. Real results depend on your calls, your close rate, and your schedule.</small>
      </div>
    </div>
  );
}
