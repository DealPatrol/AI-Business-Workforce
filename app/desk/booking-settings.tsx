'use client';

import { useState } from 'react';
import type { Blackout, WeeklyHours } from '@/lib/ava/booking/slots';
import styles from './desk.module.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type Props = {
  enabled: boolean;
  isDemo: boolean;
  slotMinutes: number;
  slotCapacity: number;
  minNoticeMinutes: number;
  horizonDays: number;
  weeklyHours: WeeklyHours;
  blackouts: Blackout[];
};

export function BookingSettings(props: Props) {
  const [enabled, setEnabled] = useState(props.enabled);
  const [hours, setHours] = useState(() =>
    DAYS.map((_, day) => {
      const range = props.weeklyHours[String(day)]?.[0];
      return { on: Boolean(range), open: range?.[0] ?? '08:00', close: range?.[1] ?? '17:00' };
    }),
  );
  const [slotMinutes, setSlotMinutes] = useState(props.slotMinutes);
  const [slotCapacity, setSlotCapacity] = useState(props.slotCapacity);
  const [minNotice, setMinNotice] = useState(props.minNoticeMinutes);
  const [horizon, setHorizon] = useState(props.horizonDays);
  const [blackouts, setBlackouts] = useState<Blackout[]>(props.blackouts);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setStatus(null);
    const weeklyHours: WeeklyHours = {};
    hours.forEach((h, day) => {
      if (h.on) weeklyHours[String(day)] = [[h.open, h.close]];
    });
    try {
      const response = await fetch('/api/desk/booking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          slotMinutes,
          slotCapacity,
          minNoticeMinutes: minNotice,
          horizonDays: horizon,
          weeklyHours,
          blackouts: blackouts.filter((b) => b.start),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; note?: string; enabled?: boolean };
      if (!response.ok) throw new Error(data.error || 'Could not save.');
      if (typeof data.enabled === 'boolean') setEnabled(data.enabled);
      setStatus({ kind: 'ok', text: data.note || 'Saved.' });
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Could not save.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className={styles.bookingForm}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <label className={styles.toggle}>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span>
          <b>Let Ava book jobs on calls</b>
          <small>She offers open windows from the hours below and books the one the caller picks.</small>
        </span>
      </label>
      {props.isDemo ? <p className={styles.muted}>This is the demo calendar the demo line books on.</p> : null}

      <fieldset className={styles.hours}>
        <legend>Bookable hours</legend>
        {hours.map((h, day) => (
          <div key={DAYS[day]} className={styles.hourRow}>
            <label>
              <input
                type="checkbox"
                checked={h.on}
                onChange={(e) => setHours((all) => all.map((x, i) => (i === day ? { ...x, on: e.target.checked } : x)))}
              />
              {DAYS[day]}
            </label>
            <input
              type="time"
              aria-label={`${DAYS[day]} opens`}
              value={h.open}
              disabled={!h.on}
              onChange={(e) => setHours((all) => all.map((x, i) => (i === day ? { ...x, open: e.target.value } : x)))}
            />
            <span aria-hidden="true">to</span>
            <input
              type="time"
              aria-label={`${DAYS[day]} closes`}
              value={h.close}
              disabled={!h.on}
              onChange={(e) => setHours((all) => all.map((x, i) => (i === day ? { ...x, close: e.target.value } : x)))}
            />
          </div>
        ))}
      </fieldset>

      <div className={styles.bookingGrid}>
        <label>
          Arrival window
          <select value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))}>
            {[30, 60, 90, 120, 180, 240].map((m) => (
              <option key={m} value={m}>{m < 60 ? `${m} minutes` : `${m / 60} hour${m === 60 ? '' : 's'}`}</option>
            ))}
          </select>
        </label>
        <label>
          Jobs per window
          <input type="number" min={1} max={20} value={slotCapacity} onChange={(e) => setSlotCapacity(Number(e.target.value))} />
        </label>
        <label>
          Minimum notice
          <select value={minNotice} onChange={(e) => setMinNotice(Number(e.target.value))}>
            {[0, 60, 120, 240, 1440].map((m) => (
              <option key={m} value={m}>{m === 0 ? 'None' : m < 1440 ? `${m / 60} hour${m === 60 ? '' : 's'}` : '1 day'}</option>
            ))}
          </select>
        </label>
        <label>
          Book up to
          <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
            {[3, 7, 14, 30].map((d) => (
              <option key={d} value={d}>{d} days ahead</option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className={styles.hours}>
        <legend>Blocked days and times</legend>
        {blackouts.length === 0 ? <p className={styles.muted}>Nothing blocked.</p> : null}
        {blackouts.map((b, index) => (
          <div key={index} className={styles.blackoutRow}>
            <input
              type="date"
              aria-label="Blocked from"
              value={b.start.slice(0, 10)}
              onChange={(e) => setBlackouts((all) => all.map((x, i) => (i === index ? { ...x, start: e.target.value } : x)))}
            />
            <span aria-hidden="true">to</span>
            <input
              type="date"
              aria-label="Blocked through"
              value={b.end.slice(0, 10)}
              onChange={(e) => setBlackouts((all) => all.map((x, i) => (i === index ? { ...x, end: e.target.value } : x)))}
            />
            <input
              type="text"
              aria-label="Note"
              placeholder="Note"
              value={b.note ?? ''}
              onChange={(e) => setBlackouts((all) => all.map((x, i) => (i === index ? { ...x, note: e.target.value } : x)))}
            />
            <button type="button" className={styles.action} onClick={() => setBlackouts((all) => all.filter((_, i) => i !== index))}>
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.action}
          onClick={() => setBlackouts((all) => [...all, { start: '', end: '', note: '' }])}
        >
          Block a day
        </button>
      </fieldset>

      <div className={styles.callFoot}>
        <button type="submit" className={styles.actionBooked} disabled={saving}>
          {saving ? 'Saving…' : 'Save booking settings'}
        </button>
        {status ? (
          <p role="status" className={status.kind === 'error' ? styles.actionError : styles.muted}>
            {status.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
