import Link from 'next/link';
import { currentUserEmail } from '@/lib/ava/client-access';
import { getOrCreateReferralCode, referralStats } from '@/lib/referrals';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Refer a shop | Front Porch Growth' };

const REWARD = process.env.NEXT_PUBLIC_REFERRAL_REWARD || '';

export default async function ReferralsPage() {
  const email = await currentUserEmail();
  let code = '';
  let stats: Record<string, number> = {};
  let error = '';
  if (email) {
    try {
      code = await getOrCreateReferralCode(email);
      stats = await referralStats(code);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Referral tracking is not set up yet.';
    }
  }
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://frontporchgrowth.com').replace(/\/$/, '');
  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui', color: '#17211b' }}>
      <small>REFERRAL PROGRAM</small>
      <h1>Know a shop that misses calls?</h1>
      <p>Share your link. When a business you send starts Ava or a postcard campaign, it is tracked to you.{REWARD ? ` Reward: ${REWARD}.` : ' Cole confirms the thank-you for each referral by email.'}</p>
      {!email && <p><Link href="/login?next=/referrals">Sign in to get your link</Link></p>}
      {error && <p role="alert">{error}</p>}
      {code && (
        <>
          <p><b>Your link:</b> <code>{`${base}/ava?ref=${code}`}</code></p>
          <p>Postcards: <code>{`${base}/postcards?ref=${code}`}</code> · Reviews: <code>{`${base}/reputationflow?ref=${code}`}</code></p>
          <p>Checkouts started: <b>{stats.checkout_started || 0}</b> · Subscribed: <b>{stats.subscribed || 0}</b></p>
          <p><small>Links are remembered for 60 days in the visitor’s browser. Share the link yourself; please don’t text people who haven’t agreed to hear from you.</small></p>
        </>
      )}
    </main>
  );
}
