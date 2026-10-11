'use client';

import { useMemo, useState } from 'react';
import { formatUsd, missedCallExample } from '@/lib/ava/missed-call-math';
import { AVA_PLANS } from '@/lib/ava/pricing';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';

export function MissedCallCalculator() {
  const [missedPerWeek, setMissedPerWeek] = useState(8);
  const [oneIn, setOneIn] = useState(4);
  const [jobValue, setJobValue] = useState(450);

  const result = useMemo(
    () => missedCallExample({ missedPerWeek, oneIn, jobValue }),
    [missedPerWeek, oneIn, jobValue],
  );

  return (
    <form className="missed-calc" onSubmit={(event) => event.preventDefault()}>
      <p className="missed-calc-note">
        Example inputs are filled in so you can see the math. Nothing here is a measured average for
        your trade.
      </p>
      <label>
        Missed calls in a normal week
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={missedPerWeek}
          onChange={(event) => setMissedPerWeek(Number(event.target.value))}
        />
      </label>
      <label>
        You assume 1 in this many would have become a job
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={oneIn}
          onChange={(event) => setOneIn(Number(event.target.value))}
        />
      </label>
      <label>
        Value of that job, in dollars
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={jobValue}
          onChange={(event) => setJobValue(Number(event.target.value))}
        />
      </label>
      <div className="missed-calc-result">
        <span>Example month from those inputs</span>
        <strong>{formatUsd(result.monthly)}</strong>
        <code>{result.formula}</code>
      </div>
      <p className="missed-calc-note">
        Ava Starter is {AVA_PLANS.starter.monthlyLabel}/month after the 7-day trial. Growth is{' '}
        {AVA_PLANS.growth.monthlyLabel}. Pro is {AVA_PLANS.pro.monthlyLabel}. The calculator does not
        subtract the plan, so you can compare the two figures yourself.
      </p>
      <TrackedCheckoutLink className="sales-btn" href="/api/checkout?plan=starter" plan="starter">
        Start free 7-day trial
      </TrackedCheckoutLink>
    </form>
  );
}
