import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { currentUserEmail, onboardingsForEmail, OPERATOR_EMAIL } from '@/lib/ava/client-access';
import { businessesFor } from '@/lib/reputation/store';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard | Front Porch Growth', robots: { index: false } };

async function safeCount(run: () => Promise<number>) {
  try { return await run(); } catch { return null; }
}

/** Real numbers only. Anything we cannot count shows "—". */
export default async function Dashboard() {
  const email = await currentUserEmail();
  if (!email) redirect('/login?next=/dashboard/ava');
  const accounts = await onboardingsForEmail(email).catch(() => []);
  const businesses = await businessesFor(email).catch(() => []);
  const admin = createAdminClient();
  const ids = accounts.map((row) => row.id);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const calls = await safeCount(async () => (ids.length ? (await admin.from('ava_call_leads').select('id', { count: 'exact', head: true }).in('onboarding_id', ids).gte('created_at', monthStart)).count ?? 0 : 0));
  const reviewAsks = await safeCount(async () => (businesses.length ? (await admin.from('rf_requests').select('id', { count: 'exact', head: true }).in('business_id', businesses.map((b) => b.id)).gte('created_at', monthStart)).count ?? 0 : 0));
  const tile: React.CSSProperties = { border: '1px solid #d9e2dc', borderRadius: 12, padding: 18, background: '#fff', color: '#17211b', textDecoration: 'none' };
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24, fontFamily: 'system-ui', color: '#17211b' }}>
      <small>FRONT PORCH GROWTH</small>
      <h1>Your dashboard</h1>
      <p>Signed in as {email}</p>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
        <Link href="/dashboard/ava" style={tile}><small>AVA CALLS THIS MONTH</small><h2>{calls ?? '—'}</h2><p>Summaries, recordings, transcripts, text-back, transfer, booking link.</p></Link>
        <Link href="/dashboard/reviews" style={tile}><small>REVIEW REQUESTS THIS MONTH</small><h2>{reviewAsks ?? '—'}</h2><p>ReputationFlow: send asks, private notes, reply drafts.</p></Link>
        <Link href="/dashboard/campaigns" style={tile}><small>POSTCARDS</small><h2>QR inbox</h2><p>Estimate requests from your campaign QR pages.</p></Link>
        <Link href="/referrals" style={tile}><small>REFERRALS</small><h2>Your link</h2><p>Track shops you send our way.</p></Link>
        {email === OPERATOR_EMAIL && <Link href="/dashboard/prospector" style={tile}><small>OPERATOR</small><h2>Lead Finder</h2><p>Maps search and approved drafts.</p></Link>}
      </section>
    </main>
  );
}
