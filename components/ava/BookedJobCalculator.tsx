'use client';

import { useMemo, useState } from 'react';
import { AVA_OFFER } from '@/lib/ava/pricing';
import styles from './offer-pricing.module.css';

const JOB_MIN = 0;
const JOB_MAX = 20;

export function BookedJobCalculator() {
  const [jobs, setJobs] = useState(4);
  const perJob = AVA_OFFER.perBookedJobCents / 100;
  const cap = AVA_OFFER.monthlyCapCents / 100;
  const jobsToCap = Math.ceil(cap / perJob);

  const { raw, billed, hitCap } = useMemo(() => {
    const rawTotal = jobs * perJob;
    const billedTotal = Math.min(rawTotal, cap);
    return { raw: rawTotal, billed: billedTotal, hitCap: rawTotal > cap };
  }, [jobs, perJob, cap]);

  return (
    <div className={styles.calculator}>
      <div className={styles.calcHead}>
        <p className={styles.kicker}>What a typical month would cost</p>
        <h2>See the {AVA_OFFER.perBookedJobLabel} rate and the {AVA_OFFER.monthlyCapLabel} cap together.</h2>
        <p>
          Move the slider. This is simple multiplication against the published offer — not a quote,
          and not a record of anyone else’s results.
        </p>
      </div>
      <label className={styles.sliderLabel} htmlFor="booked-jobs">
        Booked jobs this month
        <strong>{jobs}</strong>
      </label>
      <input
        id="booked-jobs"
        className={styles.slider}
        type="range"
        min={JOB_MIN}
        max={JOB_MAX}
        step={1}
        value={jobs}
        onChange={(event) => setJobs(Number(event.target.value))}
      />
      <div className={styles.calcResult}>
        <div>
          <span>You would pay</span>
          <strong>${billed.toLocaleString('en-US')}</strong>
        </div>
        <p>
          {jobs === 0
            ? 'Zero booked jobs means $0 after the pilot. The card stays on file; nothing is billed for empty months.'
            : hitCap
              ? `${jobs} × ${AVA_OFFER.perBookedJobLabel} would be $${raw.toLocaleString('en-US')}, but the month stops at ${AVA_OFFER.monthlyCapLabel}. The cap is reached at ${jobsToCap} booked jobs.`
              : `${jobs} × ${AVA_OFFER.perBookedJobLabel} = $${raw.toLocaleString('en-US')}. The cap of ${AVA_OFFER.monthlyCapLabel} kicks in at ${jobsToCap} booked jobs.`}
        </p>
      </div>
    </div>
  );
}
