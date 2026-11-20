import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { bookingWindowLabel } from '@/lib/ava/booking/event';
import { verifyBookingLinkToken } from '@/lib/ava/booking/ics';
import { publicOpenSlots } from '@/lib/ava/booking/public-booking';
import { businessNameForCalendar, getBooking, getCalendar } from '@/lib/ava/booking/store';
import { UUID_PATTERN } from '@/lib/leads/types';
import { Manager } from './manager';
import styles from '../../schedule.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your appointment', robots: { index: false, follow: false } };

type Props = { params: Promise<{ bookingId: string }>; searchParams: Promise<{ t?: string }> };

/** Reschedule or cancel from the confirmation email link. No login; the signed link is the key. */
export default async function ManagePage({ params, searchParams }: Props) {
  const { bookingId } = await params;
  const { t = '' } = await searchParams;
  if (!UUID_PATTERN.test(bookingId) || !verifyBookingLinkToken(bookingId, t)) notFound();
  const booking = await getBooking(bookingId).catch(() => null);
  const calendar = booking ? await getCalendar(booking.calendar_id).catch(() => null) : null;
  if (!booking || !calendar) notFound();
  const business = await businessNameForCalendar(calendar);
  const upcoming = booking.status === 'booked' && booking.start_at > new Date().toISOString();
  const slots = upcoming ? await publicOpenSlots(calendar, new Date(), undefined, booking.id).catch(() => []) : [];
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <h1>Your appointment{business ? ` with ${business}` : ''}</h1>
        {upcoming ? (
          <Manager
            bookingId={bookingId}
            token={t}
            when={bookingWindowLabel(booking, calendar.timezone || 'America/Chicago')}
            slots={slots.map((s) => ({ start: s.start, label: s.label, localDate: s.localDate }))}
          />
        ) : (
          <p className={styles.lede}>{booking.status === 'canceled' ? 'This appointment was canceled.' : 'This appointment has passed.'} Call the business to book again.</p>
        )}
      </div>
    </main>
  );
}
