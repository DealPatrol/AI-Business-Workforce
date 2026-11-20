'use client';

import { useState } from 'react';
import { SlotPicker, type PickerSlot } from '../../slot-picker';
import styles from '../../schedule.module.css';

export function Manager({ bookingId, token, when, slots }: { bookingId: string; token: string; when: string; slots: PickerSlot[] }) {
  const [mode, setMode] = useState<'view' | 'move'>('view');
  const [slot, setSlot] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  async function act(action: 'reschedule' | 'cancel') {
    if (action === 'cancel' && !window.confirm('Cancel this appointment?')) return;
    if (action === 'reschedule' && !slot) return setError('Pick a new time.');
    setBusy(true);
    setError('');
    const res = await fetch('/api/ava/public-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, booking_id: bookingId, t: token, slot_start: slot }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !out.ok) return setError(out.error || 'That did not go through.');
    setDone(action === 'cancel' ? 'Your appointment is canceled.' : `Moved to ${out.window}.`);
  }

  if (done) return <div className={styles.ok} role="status"><b>{done}</b></div>;
  return (
    <div className={styles.form}>
      <p><b>{when}</b></p>
      {mode === 'move' ? (
        <>
          <SlotPicker slots={slots} value={slot} onChange={setSlot} />
          <button className={styles.btn} type="button" disabled={busy} onClick={() => act('reschedule')}>Move to this time</button>
        </>
      ) : (
        <button className={styles.btn} type="button" onClick={() => setMode('move')}>Reschedule</button>
      )}
      <button className={styles.ghost} type="button" disabled={busy} onClick={() => act('cancel')}>Cancel appointment</button>
      {error ? <p className={styles.err} role="alert">{error}</p> : null}
    </div>
  );
}
