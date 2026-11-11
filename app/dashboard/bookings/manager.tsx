'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../leads/leads.module.css';
import type { BookingAppointment, BookingBusiness, BookingService } from '@/lib/bookings/store';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function money(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatWhen(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

type HoursRow = { weekday: number; startTime: string; endTime: string };
type Blackout = { id: string; start_date: string; end_date: string; note: string | null };

export default function BookingManager({
  businesses,
  selected,
  services,
  hours,
  blackouts,
  appointments,
  origin,
}: {
  businesses: BookingBusiness[];
  selected: BookingBusiness | null;
  services: BookingService[];
  hours: HoursRow[];
  blackouts: Blackout[];
  appointments: BookingAppointment[];
  origin: string;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const publicUrl = selected ? `${origin}/book/${selected.slug}` : '';

  const hourState = useMemo(() => {
    const map = new Map(hours.map((row) => [row.weekday, row]));
    return WEEKDAYS.map((_, weekday) => map.get(weekday) ?? { weekday, startTime: '', endTime: '' });
  }, [hours]);
  const [hourDraft, setHourDraft] = useState(hourState);

  async function post(action: string, payload: Record<string, unknown>, label: string) {
    setError('');
    setBusy(label);
    try {
      const response = await fetch('/api/bookings/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not save.');
        return;
      }
      router.refresh();
    } catch {
      setError('Could not save.');
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      {error ? <div className={styles.alert}>{error}</div> : null}
      {businesses.length > 1 && selected ? (
        <p className={styles.meta}>Showing {selected.name}. You have {businesses.length} booking pages.</p>
      ) : null}

      <form
        className={styles.panel}
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void post(
            'createBusiness',
            {
              name: String(form.get('name') ?? ''),
              slug: String(form.get('slug') ?? ''),
              email: String(form.get('email') ?? ''),
              timezone: String(form.get('timezone') ?? 'America/Chicago'),
            },
            'business',
          );
        }}
      >
        <h2>{selected ? 'Add another booking page' : 'Create a booking page'}</h2>
        <label className={styles.meta}>
          Business name
          <input className={styles.search + ' '} name="name" required placeholder="Cole HVAC" style={{ minHeight: 44, width: '100%', marginTop: 6 }} />
        </label>
        <label className={styles.meta}>
          URL slug
          <input name="slug" placeholder="cole-hvac" style={{ minHeight: 44, width: '100%', marginTop: 6 }} />
        </label>
        <label className={styles.meta}>
          Confirmation email
          <input name="email" type="email" style={{ minHeight: 44, width: '100%', marginTop: 6 }} />
        </label>
        <input type="hidden" name="timezone" value="America/Chicago" />
        <button className={styles.save} type="submit" disabled={Boolean(busy)}>
          {busy === 'business' ? 'Saving…' : 'Create page'}
        </button>
      </form>

      {selected ? (
        <>
          <div className={styles.panel} style={{ marginTop: 16 }}>
            <h2>{selected.name}</h2>
            <p className={styles.meta}>
              Public page: <a href={publicUrl}>{publicUrl}</a>
            </p>
          </div>

          <form
            className={styles.panel}
            style={{ marginTop: 16 }}
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void post(
                'addService',
                {
                  businessId: selected.id,
                  name: String(form.get('serviceName') ?? ''),
                  durationMinutes: Number(form.get('durationMinutes')),
                  price: Number(form.get('price')),
                  depositType: String(form.get('depositType') ?? 'amount'),
                  deposit: Number(form.get('deposit')),
                },
                'service',
              );
            }}
          >
            <h2>Services</h2>
            {services.length === 0 ? <p className={styles.meta}>No services yet.</p> : null}
            <div className={styles.list}>
              {services.map((service) => (
                <div key={service.id} className={styles.card}>
                  <b>{service.name}</b>
                  <small>
                    {service.duration_minutes} min · {money(service.price_cents)} · deposit{' '}
                    {service.deposit_cents != null ? money(service.deposit_cents) : `${service.deposit_percent}%`}
                  </small>
                </div>
              ))}
            </div>
            <label className={styles.meta}>
              Name
              <input name="serviceName" required placeholder="Tune-up" style={{ minHeight: 44, width: '100%', marginTop: 6 }} />
            </label>
            <label className={styles.meta}>
              Duration (minutes)
              <input name="durationMinutes" type="number" min={15} step={15} defaultValue={60} required style={{ minHeight: 44, width: '100%', marginTop: 6 }} />
            </label>
            <label className={styles.meta}>
              Price (dollars)
              <input name="price" type="number" min={0} step="0.01" required style={{ minHeight: 44, width: '100%', marginTop: 6 }} />
            </label>
            <label className={styles.meta}>
              Deposit type
              <select name="depositType" defaultValue="amount" style={{ minHeight: 44, width: '100%', marginTop: 6 }}>
                <option value="amount">Fixed dollar amount</option>
                <option value="percent">Percent of price</option>
              </select>
            </label>
            <label className={styles.meta}>
              Deposit
              <input name="deposit" type="number" min={0} step="0.01" required style={{ minHeight: 44, width: '100%', marginTop: 6 }} />
            </label>
            <button className={styles.save} type="submit" disabled={Boolean(busy)}>
              {busy === 'service' ? 'Saving…' : 'Add service'}
            </button>
          </form>

          <form
            className={styles.panel}
            style={{ marginTop: 16 }}
            onSubmit={(event) => {
              event.preventDefault();
              void post(
                'saveHours',
                {
                  businessId: selected.id,
                  hours: hourDraft.filter((row) => row.startTime && row.endTime),
                },
                'hours',
              );
            }}
          >
            <h2>Weekly hours</h2>
            {hourDraft.map((row, index) => (
              <div key={row.weekday} className={styles.row}>
                <b>{WEEKDAYS[row.weekday]}</b>
                <span style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="time"
                    value={row.startTime}
                    onChange={(event) => {
                      const next = [...hourDraft];
                      next[index] = { ...row, startTime: event.target.value };
                      setHourDraft(next);
                    }}
                    style={{ minHeight: 44, flex: 1 }}
                  />
                  <input
                    type="time"
                    value={row.endTime}
                    onChange={(event) => {
                      const next = [...hourDraft];
                      next[index] = { ...row, endTime: event.target.value };
                      setHourDraft(next);
                    }}
                    style={{ minHeight: 44, flex: 1 }}
                  />
                </span>
              </div>
            ))}
            <p className={styles.meta}>Leave a day blank to close it.</p>
            <button className={styles.save} type="submit" disabled={Boolean(busy)}>
              {busy === 'hours' ? 'Saving…' : 'Save hours'}
            </button>
          </form>

          <form
            className={styles.panel}
            style={{ marginTop: 16 }}
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void post(
                'addBlackout',
                {
                  businessId: selected.id,
                  startDate: String(form.get('startDate') ?? ''),
                  endDate: String(form.get('endDate') ?? ''),
                  note: String(form.get('note') ?? ''),
                },
                'blackout',
              );
            }}
          >
            <h2>Blackout dates</h2>
            {blackouts.map((item) => (
              <div key={item.id} className={styles.card}>
                <b>{item.start_date === item.end_date ? item.start_date : `${item.start_date} – ${item.end_date}`}</b>
                <small>{item.note}</small>
                <button
                  className={styles.statusButton}
                  type="button"
                  onClick={() => post('deleteBlackout', { id: item.id }, 'delete-blackout')}
                >
                  Remove
                </button>
              </div>
            ))}
            <label className={styles.meta}>
              Start
              <input name="startDate" type="date" required style={{ minHeight: 44, width: '100%', marginTop: 6 }} />
            </label>
            <label className={styles.meta}>
              End
              <input name="endDate" type="date" style={{ minHeight: 44, width: '100%', marginTop: 6 }} />
            </label>
            <label className={styles.meta}>
              Note
              <input name="note" style={{ minHeight: 44, width: '100%', marginTop: 6 }} />
            </label>
            <button className={styles.save} type="submit" disabled={Boolean(busy)}>
              {busy === 'blackout' ? 'Saving…' : 'Add blackout'}
            </button>
          </form>

          <section className={styles.panel} style={{ marginTop: 16 }}>
            <h2>Appointments</h2>
            {appointments.length === 0 ? <p className={styles.meta}>No bookings yet.</p> : null}
            <div className={styles.list}>
              {appointments.map((item) => (
                <div key={item.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <b>{item.customer_name || 'Customer'}</b>
                    <em className={styles.badge}>{item.status}</em>
                  </div>
                  <small>{formatWhen(item.start_at, selected.timezone)} · {money(item.deposit_cents)} deposit</small>
                  <small>{[item.customer_email, item.customer_phone].filter(Boolean).join(' · ')}</small>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
