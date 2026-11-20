'use client';

import { FormEvent, useState } from 'react';
import { SlotPicker, type PickerSlot } from '../slot-picker';
import styles from '../schedule.module.css';

export function Scheduler({ calendarId, token, slots }: { calendarId: string; token: string; slots: PickerSlot[] }) {
  const [slot, setSlot] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const [booked, setBooked] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slot) return setError('Pick a time first.');
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setState('sending');
    setError('');
    const res = await fetch('/api/ava/public-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, action: 'book', calendar_id: calendarId, t: token, slot_start: slot }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out.ok) {
      setState('idle');
      setError(out.error || 'That did not go through. Try another time.');
      return;
    }
    setBooked(out.window);
    setState('done');
  }

  if (state === 'done') {
    return (
      <div className={styles.ok} role="status">
        <b>You’re booked: {booked}.</b>
        <p>This is an arrival window. The team will confirm before the visit. If you gave an email, a confirmation with a reschedule or cancel link is on its way.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <SlotPicker slots={slots} value={slot} onChange={setSlot} />
      <label>Name<input name="name" required autoComplete="name" /></label>
      <label>Phone<input name="phone" required type="tel" autoComplete="tel" /></label>
      <label>Email (for your confirmation)<input name="email" type="email" autoComplete="email" /></label>
      <label>Service address<input name="address" autoComplete="street-address" /></label>
      <label>What do you need?<textarea name="issue" rows={3} /></label>
      {error ? <p className={styles.err} role="alert">{error}</p> : null}
      <button className={styles.btn} type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Booking…' : 'Book this time'}
      </button>
    </form>
  );
}
