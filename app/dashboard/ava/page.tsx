import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { currentUserEmail, onboardingsForEmail } from '@/lib/ava/client-access';
import { loadClientSettings } from '@/lib/ava/client-settings';
import SettingsForm from './settings-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ava calls | Front Porch Growth', robots: { index: false } };

type Lead = {
  id: string;
  created_at: string;
  caller_name: string | null;
  caller_phone: string | null;
  service_job_type: string | null;
  property_address: string | null;
  intent_urgency: string | null;
  summary: string;
  transcript: { role: string; message: string }[] | null;
  call_duration_secs?: number | null;
  textback_sent_at?: string | null;
};

const box: React.CSSProperties = { border: '1px solid #d9e2dc', borderRadius: 12, padding: 16, marginBottom: 14, background: '#fff' };

export default async function AvaClientDashboard({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const email = await currentUserEmail();
  if (!email) redirect('/login?next=/dashboard/ava');
  const accounts = await onboardingsForEmail(email);
  const { account } = await searchParams;
  const current = accounts.find((row) => row.id === account) || accounts[0];

  if (!current) {
    return (
      <main style={{ maxWidth: 760, margin: '40px auto', padding: 20, fontFamily: 'system-ui' }}>
        <h1>Ava call log</h1>
        <p>No Ava account is linked to {email} yet. Use the email you gave at checkout or setup, or email colecollins763@gmail.com.</p>
        <Link href="/ava">Back to Ava</Link>
      </main>
    );
  }

  const settings = await loadClientSettings(current.id);
  const { data } = await createAdminClient()
    .from('ava_call_leads')
    .select('*')
    .eq('onboarding_id', current.id)
    .order('created_at', { ascending: false })
    .limit(100);
  const leads = (data ?? []) as Lead[];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const thisMonth = leads.filter((lead) => lead.created_at >= monthStart);
  const minutes = Math.round(thisMonth.reduce((sum, lead) => sum + (lead.call_duration_secs || 0), 0) / 60);

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 20, fontFamily: 'system-ui', color: '#17211b', background: '#f6f8f6', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <small>AVA · CLIENT DASHBOARD</small>
          <h1 style={{ margin: '4px 0' }}>{current.business_name || 'Your business'}</h1>
          <p style={{ margin: 0 }}>Signed in as {email}</p>
        </div>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link href="/dashboard/reviews">Reviews</Link>
          <Link href="/referrals">Refer a shop</Link>
        </nav>
      </header>
      {accounts.length > 1 && (
        <p>
          Accounts:{' '}
          {accounts.map((row) => (
            <Link key={row.id} href={`/dashboard/ava?account=${row.id}`} style={{ marginRight: 10 }}>
              {row.business_name || row.id.slice(0, 8)}
            </Link>
          ))}
        </p>
      )}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, margin: '18px 0' }}>
        <div style={box}><small>CALLS THIS MONTH</small><h2>{thisMonth.length}</h2></div>
        <div style={box}><small>MINUTES THIS MONTH (logged)</small><h2>{minutes}</h2></div>
        <div style={box}><small>TEXT-BACKS SENT</small><h2>{leads.filter((lead) => lead.textback_sent_at).length}</h2></div>
      </section>
      <section style={box}>
        <h2>Settings</h2>
        <SettingsForm onboardingId={current.id} hasAgent={Boolean(current.elevenlabs_agent_id)} initial={settings} />
      </section>
      <h2>Calls</h2>
      {leads.length === 0 && <p style={box}>No calls yet. Each finished call shows here with a summary, transcript, and recording.</p>}
      {leads.map((lead) => (
        <article key={lead.id} style={box}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <b>{lead.caller_name || 'Unknown caller'} · {lead.caller_phone || 'no number'}</b>
            <span>{new Date(lead.created_at).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT{lead.call_duration_secs ? ` · ${Math.ceil(lead.call_duration_secs / 60)} min` : ''}</span>
          </div>
          <p style={{ margin: '6px 0' }}>{[lead.service_job_type, lead.property_address, lead.intent_urgency].filter(Boolean).join(' · ')}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{lead.summary}</p>
          <audio controls preload="none" src={`/api/ava/client/recording?lead=${lead.id}`} style={{ width: '100%' }} />
          <details>
            <summary>Transcript</summary>
            {(lead.transcript || []).filter((turn) => turn.message).map((turn, index) => (
              <p key={index} style={{ margin: '4px 0' }}><b>{turn.role === 'agent' ? 'Ava' : 'Caller'}:</b> {turn.message}</p>
            ))}
          </details>
        </article>
      ))}
    </main>
  );
}
