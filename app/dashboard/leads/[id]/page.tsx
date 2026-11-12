import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Phone } from 'lucide-react';
import LogoutButton from '@/app/dashboard/campaigns/logout-button';
import { ownerCanAccessLead } from '@/lib/leads/access';
import { clientIdsForOwnerEmail, getLead } from '@/lib/leads/store';
import { UUID_PATTERN } from '@/lib/leads/types';
import { createClient } from '@/lib/supabase/server';
import LeadDetail from './lead-detail';
import styles from '../leads.module.css';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/dashboard/leads/${id}`);

  let lead = null;
  try {
    const clientIds = await clientIdsForOwnerEmail(authData.user.email ?? '');
    const loaded = await getLead(id);
    if (loaded && ownerCanAccessLead(loaded, authData.user.id, clientIds)) lead = loaded;
  } catch (error) {
    console.error('Unable to load Executive Receptionist lead', error);
  }
  if (!lead) notFound();

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
        </nav>
        <div className={styles.logout}>
          <LogoutButton />
        </div>
      </aside>
      <section className={styles.main}>
        <Link className={styles.back} href="/dashboard/leads">Back to leads</Link>
        <header>
          <span className={styles.eyebrow}>LEAD</span>
          <h1 className={styles.title}>{lead.caller_name || 'Unknown caller'}</h1>
          <p className={styles.lede}>Update the status when you reach this caller. Booked marks the job as won.</p>
        </header>
        <LeadDetail lead={lead} />
      </section>
    </main>
  );
}
