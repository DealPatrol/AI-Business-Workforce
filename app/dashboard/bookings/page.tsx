import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Phone } from 'lucide-react';
import LogoutButton from '@/app/dashboard/campaigns/logout-button';
import { getSiteUrl } from '@/lib/site-url';
import {
  listAppointments,
  listBlackouts,
  listBusinessesForOwner,
  listHours,
  listServices,
} from '@/lib/bookings/store';
import { createClient } from '@/lib/supabase/server';
import BookingManager from './manager';
import styles from '../leads/leads.module.css';

export const dynamic = 'force-dynamic';

export default async function BookingsDashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect('/login?next=/dashboard/bookings');

  let loadError = '';
  let businesses = [] as Awaited<ReturnType<typeof listBusinessesForOwner>>;
  try {
    businesses = await listBusinessesForOwner(authData.user.id);
  } catch (error) {
    console.error('Unable to load booking pages', error);
    loadError = 'Booking data could not be loaded. Confirm the workforce bookings migration and Supabase environment.';
  }

  const selected = businesses[0] ?? null;
  const [services, hours, blackouts, appointments] = selected
    ? await Promise.all([
        listServices(selected.id),
        listHours(selected.id).then((rows) =>
          rows.map((row) => ({
            weekday: row.weekday,
            startTime: String(row.start_time).slice(0, 5),
            endTime: String(row.end_time).slice(0, 5),
          })),
        ),
        listBlackouts(selected.id),
        listAppointments(selected.id),
      ])
    : [[], [], [], []];

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <span><Phone size={16} /></span>
          Front Porch
        </Link>
        <nav>
          <Link href="/dashboard">Overview</Link>
          <Link href="/dashboard/leads">Leads</Link>
          <Link className={styles.active} href="/dashboard/bookings">Bookings</Link>
          <Link href="/dashboard/campaigns">Campaign inbox</Link>
        </nav>
        <div className={styles.logout}>
          <LogoutButton />
        </div>
      </aside>
      <section className={styles.main}>
        <header>
          <span>FRONT PORCH GROWTH</span>
          <h1>Booking calendar</h1>
          <p>Customers pick a time on your public page and pay a deposit to hold it. Confirmed bookings also show up in Leads.</p>
        </header>
        {loadError ? <div className={styles.alert}>{loadError}</div> : null}
        <BookingManager
          businesses={businesses}
          selected={selected}
          services={services}
          hours={hours}
          blackouts={blackouts}
          appointments={appointments}
          origin={getSiteUrl().replace(/\/$/, '')}
        />
      </section>
    </main>
  );
}
