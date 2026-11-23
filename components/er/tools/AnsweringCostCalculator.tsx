'use client';

import { useState } from 'react';
import { AVA_PLAN_KEYS, AVA_PLANS } from '@/lib/ava/pricing';
import styles from '../er-site.module.css';

type Mode = 'minute' | 'call';

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function AnsweringCostCalculator() {
  const [calls, setCalls] = useState('100');
  const [length, setLength] = useState('3');
  const [mode, setMode] = useState<Mode>('minute');
  const [rate, setRate] = useState('');
  const [base, setBase] = useState('0');
  const minutes = Math.round(num(calls) * num(length));
  const theirs = num(base) + (mode === 'minute' ? minutes : num(calls)) * num(rate);
  const planKey = AVA_PLAN_KEYS.find((k) => AVA_PLANS[k].minutes >= minutes) ?? 'elite';
  const plan = AVA_PLANS[planKey];
  return (
    <div className={styles.tool}>
      <div className={styles.fields}>
        <label className={styles.field}>
          Calls a month
          <input type="number" min={0} value={calls} onChange={(e) => setCalls(e.target.value)} />
        </label>
        <label className={styles.field}>
          Average call length (minutes)
          <input type="number" min={0} step="0.5" value={length} onChange={(e) => setLength(e.target.value)} />
        </label>
        <label className={styles.field}>
          Their price is per
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="minute">minute</option>
            <option value="call">call</option>
          </select>
        </label>
        <label className={styles.field}>
          Their price ($ per {mode})
          <input type="number" min={0} step="0.01" placeholder="from their quote" value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
        <label className={styles.field}>
          Their monthly base fee ($)
          <input type="number" min={0} value={base} onChange={(e) => setBase(e.target.value)} />
        </label>
      </div>
      <p className={styles.result}>
        About <b>{minutes.toLocaleString('en-US')}</b> minutes a month.
      </p>
      {num(rate) > 0 ? (
        <p className={styles.result}>
          The service you entered: <b>{money(theirs)}</b> a month.
        </p>
      ) : (
        <p className={styles.note}>Enter the per-minute or per-call price from the quote you have.</p>
      )}
      <p className={styles.result}>
        Ava {plan.label}: <b>{plan.monthlyLabel}</b> a month for {plan.minutesLabel}
        {plan.firstMonthLabel ? ` (first month ${plan.firstMonthLabel})` : ''}.
      </p>
      {minutes > AVA_PLANS.elite.minutes ? (
        <p className={styles.note}>That is more than Elite’s 2,000 minutes. Call (256) 595-3354 to talk it through.</p>
      ) : null}
      <p className={styles.note}>
        Your inputs, not an industry average. Starter and up have no per-minute overage (Overflow bills $1/min after 60): past your minutes she keeps answering and we reach out about a
        bigger plan.
      </p>
    </div>
  );
}
