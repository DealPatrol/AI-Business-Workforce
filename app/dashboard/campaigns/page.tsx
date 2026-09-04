import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink, Inbox, Leaf, Mail, MapPin, QrCode } from 'lucide-react';
import { formatRecipientAddress } from '@/lib/campaigns';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from './logout-button';
import styles from './campaigns.module.css';

export const dynamic = 'force-dynamic';

type EstimateRequest = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: 'new' | 'contacted' | 'closed';
  requested_at: string;
};

type Recipient = {
  id: string;
  public_token: string;
  homeowner_name: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  recipient_scans: Array<{ id: string; scanned_at: string }>;
  estimate_requests: EstimateRequest[];
};

type Campaign = {
  id: string;
  name: string;
  business_name: string;
  status: 'draft' | 'active' | 'complete';
  created_at: string;
  campaign_recipients: Recipient[];
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export default async function CampaignInboxPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect('/login?next=/dashboard/campaigns');

  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      id,
      name,
      business_name,
      status,
      created_at,
      campaign_recipients (
        id,
        public_token,
        homeowner_name,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        recipient_scans (id, scanned_at),
        estimate_requests (id, name, email, phone, message, status, requested_at)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Unable to load campaign inbox', error);
  }

  const campaigns = (data ?? []) as unknown as Campaign[];
  const recipients = campaigns.flatMap((campaign) =>
    campaign.campaign_recipients.map((recipient) => ({ campaign, recipient })),
  );
  const estimates = recipients.flatMap(({ campaign, recipient }) =>
    recipient.estimate_requests.map((estimate) => ({ campaign, recipient, estimate })),
  ).sort((left, right) =>
    new Date(right.estimate.requested_at).getTime() - new Date(left.estimate.requested_at).getTime(),
  );
  const scanCount = recipients.reduce(
    (total, item) => total + item.recipient.recipient_scans.length,
    0,
  );
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <span><Leaf size={17} /></span> Workforce<b>AI</b>
        </Link>
        <nav>
          <Link href="/dashboard">Overview</Link>
          <Link className={styles.active} href="/dashboard/campaigns">Campaign inbox</Link>
          <Link href="/visual-canvasser">Campaign offer</Link>
        </nav>
        <LogoutButton />
      </aside>

      <section className={styles.main}>
        <header>
          <div>
            <span>POSTCARD CAMPAIGNS</span>
            <h1>QR lead inbox</h1>
            <p>Live page opens and estimate requests from your mailed recipients.</p>
          </div>
        </header>

        {error && (
          <div className={styles.alert}>
            Campaign data could not be loaded. Confirm the migration and Supabase environment.
          </div>
        )}

        <div className={styles.stats}>
          <article><Mail /><span><small>RECIPIENTS</small><b>{recipients.length}</b></span></article>
          <article><QrCode /><span><small>PAGE OPENS</small><b>{scanCount}</b></span></article>
          <article><Inbox /><span><small>ESTIMATE REQUESTS</small><b>{estimates.length}</b></span></article>
        </div>

        <div className={styles.grid}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><span>LEADS</span><h2>Estimate requests</h2></div>
              <b>{estimates.length}</b>
            </div>
            {estimates.length === 0 ? (
              <div className={styles.empty}>
                <Inbox />
                <b>No estimate requests yet</b>
                <p>Requests submitted from a recipient QR page will appear here.</p>
              </div>
            ) : estimates.map(({ campaign, recipient, estimate }) => (
              <article className={styles.lead} key={estimate.id}>
                <div className={styles.leadTop}>
                  <div>
                    <span className={styles.newBadge}>{estimate.status}</span>
                    <h3>{estimate.name}</h3>
                  </div>
                  <time>{formatTime(estimate.requested_at)} UTC</time>
                </div>
                <p><MapPin size={14} /> {formatRecipientAddress(recipient).join(', ')}</p>
                <div className={styles.contact}>
                  {estimate.phone && <a href={`tel:${estimate.phone}`}>{estimate.phone}</a>}
                  {estimate.email && <a href={`mailto:${estimate.email}`}>{estimate.email}</a>}
                </div>
                {estimate.message && <blockquote>{estimate.message}</blockquote>}
                <small>{campaign.name}</small>
              </article>
            ))}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><span>RECIPIENTS</span><h2>QR activity</h2></div>
              <b>{recipients.length}</b>
            </div>
            {recipients.length === 0 ? (
              <div className={styles.empty}>
                <QrCode />
                <b>No campaign recipients</b>
                <p>Create a campaign and recipients with the included seed SQL.</p>
              </div>
            ) : recipients.map(({ campaign, recipient }) => {
              const latestScan = [...recipient.recipient_scans]
                .sort((left, right) =>
                  new Date(right.scanned_at).getTime() - new Date(left.scanned_at).getTime(),
                )[0];
              const qrPath = `/q/${recipient.public_token}`;
              return (
                <article className={styles.recipient} key={recipient.id}>
                  <div>
                    <span className={styles.campaign}>{campaign.name}</span>
                    <h3>{recipient.homeowner_name ?? recipient.address_line_1}</h3>
                    <p>{formatRecipientAddress(recipient).join(', ')}</p>
                  </div>
                  <div className={styles.activity}>
                    <b>{recipient.recipient_scans.length}</b>
                    <span>{recipient.recipient_scans.length === 1 ? 'open' : 'opens'}</span>
                    <small>{latestScan ? `Latest ${formatTime(latestScan.scanned_at)} UTC` : 'Not opened'}</small>
                  </div>
                  <a href={`${appUrl}${qrPath}`} target="_blank" rel="noreferrer">
                    Open page <ExternalLink size={13} />
                  </a>
                  <code>{`${appUrl}${qrPath}`}</code>
                </article>
              );
            })}
          </section>
        </div>
      </section>
    </main>
  );
}
