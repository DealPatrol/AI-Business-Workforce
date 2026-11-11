'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from '../book.module.css';
import { depositCents } from '@/lib/bookings/slots';
import type { BookingService } from '@/lib/bookings/store';

type Slot = { startAt: string; endAt: string; label: string };

function money(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function todayInput() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return parts;
}

export default function Booker({
  slug,
  services,
  canceled,
}: {
  slug: string;
  services: BookingService[];
  canceled?: boolean;
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [date, setDate] = useState(todayInput());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(canceled ? 'Checkout was canceled. Pick a time again.' : '');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const service = useMemo(() => services.find((item) => item.id === serviceId), [services, serviceId]);
  const deposit = service
    ? depositCents({
        priceCents: service.price_cents,
        depositCents: service.deposit_cents,
        depositPercent: service.deposit_percent,
      })
    : 0;

  useEffect(() => {
    if (!serviceId || !date) return;
    setLoadingSlots(true);
    setSlot('');
    fetch(`/api/bookings/slots?slug=${encodeURIComponent(slug)}&serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not load times.');
        setSlots(data.slots ?? []);
      })
      .catch((err: Error) => {
        setSlots([]);
        setError(err.message);
      })
      .finally(() => setLoadingSlots(false));
  }, [slug, serviceId, date]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!slot) {
      setError('Pick a time first.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/bookings/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, serviceId, startAt: slot, name, email, phone }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) {
        setError(typeof data.error === 'string' ? data.error : 'Checkout could not be started.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Checkout could not be started.');
    } finally {
      setLoading(false);
    }
  }

  if (services.length === 0) {
    return <p className={styles.lede}>This page does not have bookable services yet.</p>;
  }

  return (
    <form className={styles.card} onSubmit={submit}>
      {error ? <div className={styles.alert}>{error}</div> : null}
      <label className={styles.field}>
        Service
        <select className={styles.control} value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
          {services.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.duration_minutes} min · {money(item.price_cents)}
            </option>
          ))}
        </select>
      </label>
      {service ? (
        <div className={styles.price}>
          <span>Total {money(service.price_cents)}</span>
          <span>Deposit due today {money(deposit)}</span>
        </div>
      ) : null}
      <label className={styles.field}>
        Date
        <input className={styles.control} type="date" min={todayInput()} value={date} onChange={(event) => setDate(event.target.value)} required />
      </label>
      <div className={styles.field}>
        Time
        {loadingSlots ? <span className={styles.muted}>Loading times…</span> : null}
        {!loadingSlots && slots.length === 0 ? <span className={styles.muted}>No open times on this day.</span> : null}
        <div className={styles.slots}>
          {slots.map((item) => (
            <button
              key={item.startAt}
              type="button"
              className={slot === item.startAt ? `${styles.slot} ${styles.slotOn}` : styles.slot}
              onClick={() => setSlot(item.startAt)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <label className={styles.field}>
        Your name
        <input className={styles.control} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
      </label>
      <label className={styles.field}>
        Email
        <input className={styles.control} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
      </label>
      <label className={styles.field}>
        Phone
        <input className={styles.control} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
      </label>
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? 'Starting checkout…' : `Pay ${money(deposit)} deposit`}
      </button>
      <p className={styles.muted}>Your time is held for 15 minutes while you pay the deposit.</p>
    </form>
  );
}
