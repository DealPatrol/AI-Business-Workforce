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
  campaign_recipients: {
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    postal_code: string;
    campaigns: {
      name: string;
    };
  };
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
  campaigns: {
    name: string;
  };
  recipient_scans: Array<{ count: number }>;
  estimate_requests: Array<{ count: number }>;
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

  const [
    { data: recipientData, error: recipientError },
    { data: estimateData, error: estimateError },
  ] = await Promise.all([
    supabase
      .from('campaign_recipients')
      .select(`
        id,
        public_token,
        homeowner_name,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        campaigns!inner (name),
        recipient_scans (count),
        estimate_requests (count)
      `)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('estimate_requests')
      .select(`
        id,
        name,
        email,
        phone,
        message,
        status,
        requested_at,
        campaign_recipients!inner (
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          campaigns!inner (name)
        )
      `)
      .order('requested_at', { ascending: false })
      .limit(100),
  ]);

  const error = recipientError ?? estimateError;
  if (error) console.error('Unable to load campaign inbox', error);

  const recipients = (recipientData ?? []) as unknown as Recipient[];
  const estimates = (estimateData ?? []) as unknown as EstimateRequest[];
  const scanCount = recipients.reduce(
    (total, recipient) => total + (recipient.recipient_scans[0]?.count ?? 0),
    0,
  );
  const estimateCount = recipients.reduce(
    (total, recipient) => total + (recipient.estimate_requests[0]?.count ?? 0),
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
          <article><Inbox /><span><small>ESTIMATE REQUESTS</small><b>{estimateCount}</b></span></article>
        </div>

        <div className={styles.grid}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><span>LEADS</span><h2>Estimate requests</h2></div>
              <b>{estimateCount}</b>
            </div>
            {estimates.length === 0 ? (
              <div className={styles.empty}>
                <Inbox />
                <b>No estimate requests yet</b>
                <p>Requests submitted from a recipient QR page will appear here.</p>
              </div>
            ) : estimates.map((estimate) => {
              const recipient = estimate.campaign_recipients;
              const campaign = recipient.campaigns;
              return (
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
              );
            })}
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
            ) : recipients.map((recipient) => {
              const campaign = recipient.campaigns;
              const recipientScanCount = recipient.recipient_scans[0]?.count ?? 0;
              const qrPath = `/q/${recipient.public_token}`;
              return (
                <article className={styles.recipient} key={recipient.id}>
                  <div>
                    <span className={styles.campaign}>{campaign.name}</span>
                    <h3>{recipient.homeowner_name ?? recipient.address_line_1}</h3>
                    <p>{formatRecipientAddress(recipient).join(', ')}</p>
                  </div>
                  <div className={styles.activity}>
                    <b>{recipientScanCount}</b>
                    <span>{recipientScanCount === 1 ? 'open' : 'opens'}</span>
                    <small>{recipientScanCount > 0 ? 'QR page opened' : 'Not opened'}</small>
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
