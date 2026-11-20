'use client';

import { useState } from 'react';
import {
  CARRIERS,
  RING_SECONDS,
  forwardingSteps,
  formatUs,
  ringsLabel,
  type CarrierKey,
  type ForwardMode,
} from '@/lib/ava/onboarding/forwarding';
import styles from './onboarding-tools.module.css';

/**
 * Per-carrier forwarding instructions. "Ring me first" sends only unanswered/busy calls to Ava,
 * after the ring time the owner picks (GSM carriers).
 */
export function CarrierForwarding({ avaNumber }: { avaNumber?: string | null }) {
  const [carrier, setCarrier] = useState<CarrierKey>('att');
  const [mode, setMode] = useState<ForwardMode>('missed');
  const [seconds, setSeconds] = useState(20);
  const steps = forwardingSteps(carrier, mode, avaNumber || '', seconds);
  const hasNumber = Boolean(avaNumber && avaNumber.replace(/\D/g, '').length >= 10);

  return (
    <section className={styles.box} aria-label="Forward your line to Ava">
      <h3>Forward your line to Ava</h3>
      <p>
        {hasNumber
          ? `Your Ava number is ${formatUs(avaNumber!)}. Dial the code from your business phone, then call your number from another phone to test.`
          : 'Your Ava number is assigned during setup. These are the codes you will dial; AVANUMBER becomes your Ava number.'}
      </p>
      <div className={styles.row}>
        <select value={carrier} onChange={(e) => setCarrier(e.target.value as CarrierKey)} aria-label="Your phone carrier">
          {CARRIERS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.modes} role="radiogroup" aria-label="Which calls go to Ava">
        <label>
          <input type="radio" name="fwd-mode" checked={mode === 'missed'} onChange={() => setMode('missed')} /> Ring me first, then Ava
        </label>
        <label>
          <input type="radio" name="fwd-mode" checked={mode === 'all'} onChange={() => setMode('all')} /> Ava answers every call
        </label>
      </div>
      {mode === 'missed' && (carrier === 'att' || carrier === 'tmobile') ? (
        <div className={styles.row}>
          <select value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} aria-label="How long your phone rings first">
            {RING_SECONDS.map((s) => (
              <option key={s} value={s}>
                Ring {s} seconds first ({ringsLabel(s)})
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {steps.dial.length ? (
        <>
          <p className={styles.small}>Dial, press call, and wait for the confirmation:</p>
          <ul className={styles.codes}>
            {steps.dial.map((code) => (
              <li key={code}>
                <code>{code}</code>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {steps.notes.map((note) => (
        <p key={note} className={styles.small}>
          {note}
        </p>
      ))}
      {steps.undo.length ? (
        <p className={styles.small}>
          To turn it off, dial {steps.undo.map((c) => <code key={c}>{c} </code>)}.
        </p>
      ) : null}
      <p className={styles.small}>Codes are your carrier’s standard ones. Some business plans differ; if a code fails, your carrier can set it up.</p>
    </section>
  );
}
