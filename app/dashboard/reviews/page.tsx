import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { currentUserEmail } from '@/lib/ava/client-access';
import { businessesFor, reviewPageUrl } from '@/lib/reputation/store';
import ReviewsClient from './reviews-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ReputationFlow dashboard', robots: { index: false } };

export default async function ReviewsDashboard({ searchParams }: { searchParams: Promise<{ b?: string }> }) {
  const email = await currentUserEmail();
  if (!email) redirect('/login?next=/dashboard/reviews');
  const businesses = await businessesFor(email);
  const { b } = await searchParams;
  const business = businesses.find((row) => row.id === b) || businesses[0] || null;
  let requests: Record<string, unknown>[] = [];
  let feedback: Record<string, unknown>[] = [];
  if (business) {
    const admin = createAdminClient();
    requests = (await admin.from('rf_requests').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(100)).data ?? [];
    feedback = (await admin.from('rf_feedback').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(50)).data ?? [];
  }
  const qr = business ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(reviewPageUrl(business.slug))}` : '';
  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 20, fontFamily: 'system-ui', color: '#17211b' }}>
      <small>REPUTATIONFLOW</small>
      <h1>Reviews</h1>
      <p>Signed in as {email} · <Link href="/dashboard/ava">Ava calls</Link> · <Link href="/reputationflow/score">Free review score</Link></p>
      {businesses.length > 1 && <p>{businesses.map((row) => <Link key={row.id} href={`/dashboard/reviews?b=${row.id}`} style={{ marginRight: 10 }}>{row.name}</Link>)}</p>}
      <ReviewsClient business={business} requests={requests} feedback={feedback} reviewUrl={business ? reviewPageUrl(business.slug) : ''} qr={qr} />
    </main>
  );
}
