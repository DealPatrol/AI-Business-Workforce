import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Phone } from 'lucide-react';
import LogoutButton from '@/app/dashboard/campaigns/logout-button';
import { matchesLeadSearch, parseLeadStatus } from '@/lib/leads/parse';
import { clientIdsForOwnerEmail, listLeadsForOwner } from '@/lib/leads/store';
import { LEAD_STATUSES, type LeadStatus } from '@/lib/leads/types';
import { createClient } from '@/lib/supabase/server';
import styles from './leads.module.css';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Chicago',
  }).format(new Date(value));
}

function badgeClass(status: LeadStatus) {
  if (status === 'Booked') return `${styles.badge} ${styles.badgeBooked}`;
  if (status === 'Contacted') return `${styles.badge} ${styles.badgeContacted}`;
  if (status === 'Not a fit') return `${styles.badge} ${styles.badgeFit}`;
  return styles.badge;
}

export default async function LeadsInboxPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect('/login?next=/dashboard/leads');

  const params = await searchParams;
  const status = parseLeadStatus(params.status) ?? undefined;
  const query = (params.q ?? '').trim();

  let loadError = '';
  let leads = [] as Awaited<ReturnType<typeof listLeadsForOwner>>;
  try {
    const clientIds = await clientIdsForOwnerEmail(authData.user.email ?? '');
    leads = await listLeadsForOwner({ ownerId: authData.user.id, clientIds });
  } catch (error) {
    console.error('Unable to load Executive Receptionist leads', error);
    loadError = 'Leads could not be loaded. Confirm the er_leads migration and Supabase environment.';
  }

  const searched = query ? leads.filter((lead) => matchesLeadSearch(lead, query)) : leads;
  const visible = status ? searched.filter((lead) => lead.status === status) : searched;
  const counts = {
    New: searched.filter((lead) => lead.status === 'New').length,
    Contacted: searched.filter((lead) => lead.status === 'Contacted').length,
    Booked: searched.filter((lead) => lead.status === 'Booked').length,
    'Not a fit': searched.filter((lead) => lead.status === 'Not a fit').length,
  };

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <span><Phone size={16} /></span>
          Receptionist
        </Link>
        <nav>
          <Link href="/dashboard">Overview</Link>
          <Link className={styles.active} href="/dashboard/leads">Leads</Link>
          <Link href="/dashboard/bookings">Bookings</Link>
          <Link href="/dashboard/campaigns">Campaign inbox</Link>
          <Link href="/dashboard/prospector">Lead Finder</Link>
        </nav>
        <div className={styles.logout}>
          <LogoutButton />
        </div>
      </aside>

      <section className={styles.main}>
        <header>
          <span>EXECUTIVE RECEPTIONIST</span>
          <h1>Leads</h1>
          <p>Callers the receptionist captured, plus web forms and people who texted first.</p>
        </header>

        {loadError && <div className={styles.alert}>{loadError}</div>}

        <div className={styles.stats}>
          <article><small>SHOWING</small><b>{visible.length}</b></article>
          <article><small>NEW</small><b>{counts.New}</b></article>
          <article><small>BOOKED</small><b>{counts.Booked}</b></article>
          <article><small>NOT A FIT</small><b>{counts['Not a fit']}</b></article>
        </div>

        <div className={styles.filters}>
          <Link className={!status ? `${styles.chip} ${styles.chipOn}` : styles.chip} href={query ? `/dashboard/leads?q=${encodeURIComponent(query)}` : '/dashboard/leads'}>
            All
          </Link>
          {LEAD_STATUSES.map((value) => {
            const href = query ? `/dashboard/leads?status=${encodeURIComponent(value)}&q=${encodeURIComponent(query)}` : `/dashboard/leads?status=${encodeURIComponent(value)}`;
            return (
              <Link key={value} className={status === value ? `${styles.chip} ${styles.chipOn}` : styles.chip} href={href}>
                {value}
              </Link>
            );
          })}
          <form className={styles.search} action="/dashboard/leads" method="get">
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <input type="search" name="q" defaultValue={query} placeholder="Search name, phone, job, or notes" />
            <button type="submit">Search</button>
          </form>
        </div>

        {visible.length === 0 ? (
          <div className={styles.empty}>
            {loadError ? 'No leads to show yet.' : 'No leads match this filter yet. New receptionist calls will land here after ingest is connected.'}
          </div>
        ) : (
          <div className={styles.list}>
            {visible.map((item) => (
              <Link key={item.id} className={styles.card} href={`/dashboard/leads/${item.id}`}>
                <div className={styles.cardTop}>
                  <b>{item.caller_name || 'Unknown caller'}</b>
                  <em className={badgeClass(item.status)}>{item.status}</em>
                </div>
                <small className={styles.meta}>
                  {[item.caller_phone, item.job_type, item.source, formatTime(item.called_at)].filter(Boolean).join(' · ')}
                </small>
                <small>{item.summary}</small>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
