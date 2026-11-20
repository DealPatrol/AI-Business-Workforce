import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicOpenSlots, verifyCalendarPublicToken } from '@/lib/ava/booking/public-booking';
import { businessNameForCalendar, getCalendar } from '@/lib/ava/booking/store';
import { UUID_PATTERN } from '@/lib/leads/types';
import { Scheduler } from './scheduler';
import styles from '../schedule.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Book a visit', robots: { index: false, follow: false } };

type Props = { params: Promise<{ calendarId: string }>; searchParams: Promise<{ t?: string }> };

/** Hosted booking page for one Ava calendar. The signed ?t= link is shared by the owner. */
export default async function SchedulePage({ params, searchParams }: Props) {
  const { calendarId } = await params;
  const { t = '' } = await searchParams;
  if (!UUID_PATTERN.test(calendarId) || !verifyCalendarPublicToken(calendarId, t)) notFound();
  const calendar = await getCalendar(calendarId).catch(() => null);
  if (!calendar || !calendar.enabled) notFound();
  const [business, slots] = await Promise.all([businessNameForCalendar(calendar), publicOpenSlots(calendar).catch(() => [])]);
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <h1>Book with {business || 'us'}</h1>
        <p className={styles.lede}>Pick an open window. Same calendar our phone receptionist books from, so nothing gets double-booked.</p>
        <Scheduler calendarId={calendarId} token={t} slots={slots.map((s) => ({ start: s.start, label: s.label, localDate: s.localDate }))} />
        <p className={styles.fine}>Online booking by Executive Receptionist.</p>
      </div>
    </main>
  );
}
