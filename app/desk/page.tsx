import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { AVA_STORE_OFFER, STORE_PLAN_KEY, storeMonthlyEstimateCents } from '@/lib/ava/store-pricing';
import { DESK_TOOLS } from '@/lib/desk-tools';
import { clientIdsForOwnerEmail, listLeadsForOwner } from '@/lib/leads/store';
import type { ErLead } from '@/lib/leads/types';
import { metadataTitle, pageSeo } from '@/lib/seo/pages';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { LeadActions } from './lead-actions';
import { SignOut } from './sign-out';
import styles from './desk.module.css';

export const dynamic = 'force-dynamic';

const seo = pageSeo('/desk');

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  robots: { index: false, follow: false },
};

type CustomerRow = {
  id: string;
  business_name: string | null;
  subscription_status: string | null;
  onboarding_id: string | null;
  plan: string | null;
};

type OnboardingRow = {
  id: string;
  business_name: string | null;
  agent_status: string | null;
  phone_status: string | null;
  channel_voice: boolean | null;
  channel_sms: boolean | null;
  channel_web_chat: boolean | null;
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  trialing: 'Pilot running',
  active: 'Active',
  past_due: 'Payment past due',
  canceled: 'Canceled',
  incomplete: 'Checkout not finished',
  unpaid: 'Unpaid',
};

function formatTime(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Chicago' }).format(new Date(value));
}

function humanStatus(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

async function loadAccount(email: string) {
  const supabase = createAdminClient();
  const { data: customers, error } = await supabase
    .from('ava_customers')
    .select('id, business_name, subscription_status, onboarding_id, email, plan');
  if (error) throw new Error(error.message);
  const needle = email.trim().toLowerCase();
  // Exact, case-insensitive match in code (an ilike pattern would treat _ and % as wildcards).
  const rows = ((customers ?? []) as Array<CustomerRow & { email: string | null }>).filter(
    (row) => Boolean(needle) && String(row.email ?? '').trim().toLowerCase() === needle,
  );
  const onboardingIds = rows.map((row) => row.onboarding_id).filter((id): id is string => Boolean(id));
  let onboardings: OnboardingRow[] = [];
  if (onboardingIds.length) {
    const { data, error: onboardingError } = await supabase
      .from('ava_onboardings')
      .select('id, business_name, agent_status, phone_status, channel_voice, channel_sms, channel_web_chat')
      .in('id', onboardingIds);
    if (onboardingError) throw new Error(onboardingError.message);
    onboardings = (data ?? []) as OnboardingRow[];
  }
  return { customer: (rows[0] ?? null) as CustomerRow | null, onboarding: (onboardings[0] ?? null) as OnboardingRow | null };
}

function startOfMonthChicago() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit' }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  return new Date(`${year}-${month}-01T06:00:00Z`);
}

export default async function DeskPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) redirect('/login?next=/desk');
  const email = user.email ?? '';

  let loadError = '';
  let leads: ErLead[] = [];
  let account: { customer: CustomerRow | null; onboarding: OnboardingRow | null } = { customer: null, onboarding: null };
  try {
    const [clientIds, accountData] = await Promise.all([clientIdsForOwnerEmail(email), loadAccount(email)]);
    account = accountData;
    leads = await listLeadsForOwner({ ownerId: user.id, clientIds });
  } catch (error) {
    console.error('Desk could not load', error);
    loadError = 'Some of your desk could not load just now. Refresh in a minute, or call Cole if it keeps happening.';
  }

  const { customer, onboarding } = account;
  const businessName = onboarding?.business_name || customer?.business_name || '';
  const newLeads = leads.filter((lead) => lead.status === 'New');
  const monthStart = startOfMonthChicago();
  const bookedThisMonth = leads.filter((lead) => lead.status === 'Booked' && lead.booked_at && new Date(lead.booked_at) >= monthStart).length;
  const isStore = customer?.plan === STORE_PLAN_KEY;
  const storeTrial = isStore && customer?.subscription_status === 'trialing';
  const callsThisMonth = leads.filter((lead) => lead.created_at && new Date(lead.created_at) >= monthStart).length;
  const billedThisMonth = isStore
    ? storeTrial
      ? 0
      : storeMonthlyEstimateCents(callsThisMonth) / 100
    : Math.min(bookedThisMonth * AVA_OFFER.perBookedJobCents, AVA_OFFER.monthlyCapCents) / 100;
  const recent = leads.slice(0, 8);

  const channels = onboarding
    ? [
        { label: 'Phone calls', on: onboarding.channel_voice !== false },
        { label: 'Website chat', on: Boolean(onboarding.channel_web_chat) },
        { label: 'Texting', on: Boolean(onboarding.channel_sms) },
      ]
    : [];

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.brand} href="/">
          <span aria-hidden="true">A</span> Your desk
        </Link>
        <div className={styles.topRight}>
          <span className={styles.who}>{email}</span>
          <SignOut />
        </div>
      </header>

      <section className={styles.hello}>
        <p className={styles.kicker}>{businessName || 'Front Porch Growth'}</p>
        <h1>{newLeads.length ? `${newLeads.length} new ${newLeads.length === 1 ? 'caller needs' : 'callers need'} a decision.` : 'You are all caught up.'}</h1>
        <p>Ava’s calls land here. Decide what happened with each caller, then jump into any tool below.</p>
      </section>

      {loadError ? <p className={styles.alert}>{loadError}</p> : null}

      <section className={styles.stats} aria-label="This month">
        <article><small>New leads</small><b>{newLeads.length}</b></article>
        <article><small>Booked this month</small><b>{bookedThisMonth}</b></article>
        <article><small>Billed this month (est.)</small><b>${billedThisMonth}</b><span>{isStore ? (storeTrial ? 'Free during your trial' : `${AVA_STORE_OFFER.monthlyLabel} + ${AVA_STORE_OFFER.perCallLabel} × ${callsThisMonth} calls`) : `max ${AVA_OFFER.monthlyCapLabel}`}</span></article>
        <article><small>All leads</small><b>{leads.length}</b></article>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="decide">
          <div className={styles.panelHead}>
            <h2 id="decide">Needs a decision</h2>
            <Link href="/dashboard/leads?status=New">All new leads →</Link>
          </div>
          {newLeads.length === 0 ? (
            <p className={styles.empty}>
              No new callers waiting. When Ava takes a call, the caller shows up here with their name, number, and what
              they need.
            </p>
          ) : (
            <ul className={styles.leads}>
              {newLeads.slice(0, 8).map((lead) => (
                <li key={lead.id}>
                  <div className={styles.leadTop}>
                    <Link href={`/dashboard/leads/${lead.id}`}>
                      <b>{lead.caller_name || 'Unknown caller'}</b>
                    </Link>
                    <span>{formatTime(lead.called_at)}</span>
                  </div>
                  <p>
                    {lead.job_type ? <em>{lead.job_type}. </em> : null}
                    {lead.summary}
                  </p>
                  {lead.caller_phone ? (
                    <a className={styles.callBack} href={`tel:${lead.caller_phone.replace(/[^\d+]/g, '')}`}>
                      Call back {lead.caller_phone}
                    </a>
                  ) : null}
                  <LeadActions id={lead.id} store={isStore} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className={styles.panel} aria-labelledby="ava-status">
          <div className={styles.panelHead}>
            <h2 id="ava-status">Ava</h2>
          </div>
          {customer ? (
            <dl className={styles.status}>
              <div><dt>Plan</dt><dd>{isStore ? 'Online Store · ' : ''}{SUBSCRIPTION_LABELS[customer.subscription_status ?? ''] ?? humanStatus(customer.subscription_status, 'Unknown')}</dd></div>
              <div><dt>Receptionist</dt><dd>{humanStatus(onboarding?.agent_status, 'Waiting on setup form')}</dd></div>
              <div><dt>Phone number</dt><dd>{humanStatus(onboarding?.phone_status, 'Not attached yet')}</dd></div>
              {channels.map((channel) => (
                <div key={channel.label}><dt>{channel.label}</dt><dd>{channel.on ? 'On' : 'Off'}</dd></div>
              ))}
            </dl>
          ) : (
            <div className={styles.empty}>
              <p>We do not see a pilot for {email || 'this email'} yet.</p>
              <p>
                Start the free 14-day pilot, or if you checked out with a different email, sign in with that one.
              </p>
              <Link className={styles.button} href="/#pricing">Start the free pilot</Link>
            </div>
          )}
          <p className={styles.help}>
            Want to change Ava’s greeting, questions, hours, or channels? Call or text Cole at{' '}
            <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>.
          </p>
          <p className={styles.help}>
            Hear how Ava sounds: call the demo line at <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a>.
          </p>
        </aside>
      </div>

      <section className={styles.panel} aria-labelledby="recent">
        <div className={styles.panelHead}>
          <h2 id="recent">Recent callers</h2>
          <Link href="/dashboard/leads">Open the CRM →</Link>
        </div>
        {recent.length === 0 ? (
          <p className={styles.empty}>No calls yet. Your first caller will appear here.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr><th>Caller</th><th>Need</th><th>When</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recent.map((lead) => (
                <tr key={lead.id}>
                  <td><Link href={`/dashboard/leads/${lead.id}`}>{lead.caller_name || 'Unknown caller'}</Link></td>
                  <td>{lead.job_type || lead.summary.slice(0, 60)}</td>
                  <td>{formatTime(lead.called_at)}</td>
                  <td><span className={styles.badge}>{lead.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.toolsWrap} aria-labelledby="tools">
        <h2 id="tools">Your tools</h2>
        <ul className={styles.tools}>
          {DESK_TOOLS.map((tool) => (
            <li key={tool.key}>
              <Link className={styles.tool} href={tool.href}>
                <b>{tool.name}</b>
                <span>{tool.what}</span>
                <small>{tool.status === 'waitlist' ? 'Waitlist' : 'Open'}</small>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
