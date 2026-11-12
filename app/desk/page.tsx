import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { AVA_OFFER, AVA_PLANS } from '@/lib/ava/pricing';
import { avaPlanForPriceId } from '@/lib/ava/plan-checkout';
import { bookingLinks, bookingWindowLabel } from '@/lib/ava/booking/event';
import { DEFAULT_WEEKLY_HOURS, localDateOf } from '@/lib/ava/booking/slots';
import { googleCalendarConfig } from '@/lib/ava/booking/google';
import {
  loadDeskAccount,
  loadDeskCalendar,
  loadDeskCalls,
  loadDeskLeads,
  loadUsageSeconds,
  type DeskBooking,
  type DeskCalendar,
  type DeskCall,
} from '@/lib/desk/data';
import { readAgentGreeting } from '@/lib/desk/eleven';
import { isEditableAgent, LEAD_STATUS_LABEL } from '@/lib/desk/settings';
import { loadDeskSubscription, type DeskSubscription } from '@/lib/desk/stripe';
import { deskUsage, minutesFromSeconds, usageWindow } from '@/lib/desk/usage';
import { DESK_TOOLS } from '@/lib/desk-tools';
import type { ErLead } from '@/lib/leads/types';
import { metadataTitle, pageSeo } from '@/lib/seo/pages';
import { createClient } from '@/lib/supabase/server';
import { BookingSettings } from './booking-settings';
import { DeskSettings } from './desk-settings';
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

const TZ = 'America/Chicago';
const CALLS_PAGE = 25;
const CALLS_ALL = 200;

const GOOGLE_STATUS: Record<string, string> = {
  connected: 'Google Calendar connected. Ava now skips your busy times and adds each booking to your calendar.',
  disconnected: 'Google Calendar disconnected. Bookings already on it stay there.',
  declined: 'Google Calendar was not connected.',
  expired: 'That Google sign-in link expired. Try Connect Google Calendar again.',
  scopes: 'Google did not grant calendar access. Try again and allow both calendar permissions.',
  setup: 'Finish setup before connecting a calendar.',
  store: 'Calendar sync is for home-service plans.',
  failed: 'Google Calendar could not be connected right now. Try again in a minute.',
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  trialing: 'Trial running',
  active: 'Active',
  past_due: 'Payment past due',
  canceled: 'Canceled',
  incomplete: 'Checkout not finished',
  unpaid: 'Unpaid',
};

const LEAD_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'New', label: 'New' },
  { key: 'Contacted', label: 'Contacted' },
  { key: 'Booked', label: 'Won' },
  { key: 'Not a fit', label: 'Not a fit' },
] as const;

function formatTime(value: string | null | undefined) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ }).format(new Date(value));
}

function formatDate(value: Date | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: TZ }).format(value);
}

function formatDuration(secs: number | null) {
  if (secs === null || secs === undefined) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}

function humanStatus(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

function dayHeading(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function renewalLine(sub: DeskSubscription | null, status: string | null | undefined) {
  if (!sub?.currentPeriodEnd) return '';
  const when = formatDate(new Date(sub.currentPeriodEnd * 1000));
  if (sub.cancelAtPeriodEnd || sub.cancelAt) return `Ends ${when}`;
  if ((sub.status || status) === 'trialing') return `Trial ends ${when}`;
  return `Renews ${when}`;
}

export default async function DeskPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = (await searchParams) ?? {};
  const googleStatus = typeof query.google === 'string' ? GOOGLE_STATUS[query.google] ?? '' : '';
  const showAllCalls = query.calls === 'all';
  const leadFilter =
    typeof query.leads === 'string' && LEAD_FILTERS.some((f) => f.key === query.leads) ? query.leads : 'all';
  const googleSyncAvailable = Boolean(googleCalendarConfig());

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) redirect('/login?next=/desk');
  const email = user.email ?? '';

  const problems: string[] = [];
  const note = (what: string) => (error: unknown) => {
    console.error(`Desk could not load ${what}`, error);
    problems.push(what);
  };

  const account = await loadDeskAccount(supabase).catch((error) => {
    note('your account')(error);
    return { customer: null, onboarding: null };
  });
  const { customer, onboarding } = account;

  const now = new Date();
  const subscription = await loadDeskSubscription(customer?.stripe_subscription_id);
  const planKey = avaPlanForPriceId(subscription?.priceId) || customer?.plan || onboarding?.selected_plan || null;
  const usagePeriod = usageWindow(
    subscription ? { start: subscription.currentPeriodStart, end: subscription.currentPeriodEnd } : null,
    TZ,
    now,
  );

  const agentId = onboarding?.elevenlabs_agent_id?.trim() || '';
  const greetingEditable = isEditableAgent(agentId);
  const isStore = customer?.plan === 'store';

  const [leads, callData, usageData, booking, greeting] = await Promise.all([
    loadDeskLeads(supabase).catch((error) => {
      note('leads')(error);
      return [] as ErLead[];
    }),
    onboarding
      ? loadDeskCalls(supabase, onboarding.id, showAllCalls ? CALLS_ALL : CALLS_PAGE).catch((error) => {
          note('call history')(error);
          return { calls: [] as DeskCall[], total: 0 };
        })
      : Promise.resolve({ calls: [] as DeskCall[], total: 0 }),
    onboarding
      ? loadUsageSeconds(supabase, onboarding.id, usagePeriod.start).catch((error) => {
          note('minutes used')(error);
          return { seconds: [] as Array<number | null>, calls: 0, unknown: 0 };
        })
      : Promise.resolve({ seconds: [] as Array<number | null>, calls: 0, unknown: 0 }),
    onboarding && !isStore
      ? loadDeskCalendar(
          supabase,
          onboarding.id,
          new Date(now.getTime() - 86_400_000).toISOString(),
          new Date(now.getTime() + 15 * 86_400_000).toISOString(),
        ).catch((error) => {
          note('the calendar')(error);
          return { calendar: null as DeskCalendar | null, bookings: [] as DeskBooking[] };
        })
      : Promise.resolve({ calendar: null as DeskCalendar | null, bookings: [] as DeskBooking[] }),
    greetingEditable ? readAgentGreeting(agentId) : Promise.resolve(''),
  ]);

  const usage = deskUsage(planKey, minutesFromSeconds(usageData.seconds));
  const plan = usage.planKey ? AVA_PLANS[usage.planKey] : null;
  const businessName = onboarding?.business_name || customer?.business_name || '';
  const newLeads = leads.filter((lead) => lead.status === 'New');
  const monthStart = usageWindow(null, TZ, now).start;
  const wonThisMonth = leads.filter((lead) => lead.status === 'Booked' && lead.booked_at && new Date(lead.booked_at) >= monthStart).length;
  const leadByConversation = new Map(leads.filter((l) => l.conversation_id).map((l) => [l.conversation_id as string, l]));
  const shownLeads = leadFilter === 'all' ? leads : leads.filter((lead) => lead.status === leadFilter);
  const leadCounts = Object.fromEntries(
    LEAD_FILTERS.map((f) => [f.key, f.key === 'all' ? leads.length : leads.filter((l) => l.status === f.key).length]),
  );

  const bookingTz = booking.calendar?.timezone || TZ;
  const bookingDays = new Map<string, DeskBooking[]>();
  for (const row of booking.bookings) {
    const day = localDateOf(new Date(row.start_at), bookingTz).date;
    bookingDays.set(day, [...(bookingDays.get(day) ?? []), row]);
  }

  const subscriptionStatus = subscription?.status || customer?.subscription_status || '';
  const renewal = renewalLine(subscription, customer?.subscription_status);
  const windowLabel =
    usagePeriod.source === 'billing'
      ? `This billing period (${formatDate(usagePeriod.start)} – ${formatDate(usagePeriod.end)})`
      : `This month (since ${formatDate(usagePeriod.start)})`;

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.brand} href="/desk">
          <span aria-hidden="true">A</span> Ava Desk
        </Link>
        <div className={styles.topRight}>
          <span className={styles.who}>{email}</span>
          <SignOut />
        </div>
      </header>

      <nav className={styles.sectionNav} aria-label="Desk sections">
        <a href="#overview">Overview</a>
        <a href="#calls">Calls</a>
        <a href="#leads">Leads</a>
        {onboarding && !isStore ? <a href="#calendar">Calendar</a> : null}
        <a href="#billing">Plan &amp; billing</a>
        <a href="#settings">Settings</a>
        <a href="#texts">Texts</a>
      </nav>

      <section id="overview" className={styles.hello}>
        <p className={styles.kicker}>{businessName || 'Executive Receptionist'}</p>
        <h1>
          {newLeads.length
            ? `${newLeads.length} new ${newLeads.length === 1 ? 'caller needs' : 'callers need'} a decision.`
            : 'You are all caught up.'}
        </h1>
        <p>Every call Ava answers lands here with the summary, transcript, and recording.</p>
      </section>

      {problems.length ? (
        <p className={styles.alert}>
          Some of your Desk could not load just now ({problems.join(', ')}). Refresh in a minute, or call{' '}
          {AVA_OFFER.contactPhoneDisplay} if it keeps happening.
        </p>
      ) : null}

      <section className={styles.stats} aria-label="At a glance">
        <article>
          <small>New leads</small>
          <b>{newLeads.length}</b>
          <span>{leads.length} leads in all</span>
        </article>
        <article>
          <small>Won this month</small>
          <b>{wonThisMonth}</b>
        </article>
        <article>
          <small>Calls answered</small>
          <b>{usageData.calls}</b>
          <span>{usagePeriod.source === 'billing' ? 'This billing period' : 'This month'}</span>
        </article>
        <article>
          <small>Minutes used</small>
          <b>{usage.used}</b>
          <span>{plan ? `of ${plan.minutes.toLocaleString('en-US')} on ${plan.label}` : 'No plan yet'}</span>
        </article>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="decide">
          <div className={styles.panelHead}>
            <h2 id="decide">Needs a decision</h2>
            <a href="?leads=New#leads">All new leads →</a>
          </div>
          {newLeads.length === 0 ? (
            <p className={styles.empty}>
              No new callers waiting. When Ava takes a call, the caller shows up here with their name, number, and what
              they need.
            </p>
          ) : (
            <ul className={styles.leads}>
              {newLeads.slice(0, 5).map((lead) => (
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
                    <a className={styles.callBack} href={telHref(lead.caller_phone)}>
                      Call back {lead.caller_phone}
                    </a>
                  ) : null}
                  <LeadActions id={lead.id} current={lead.status} />
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
              <div>
                <dt>Plan</dt>
                <dd>{plan ? plan.label : humanStatus(planKey, 'None')}</dd>
              </div>
              <div>
                <dt>Billing</dt>
                <dd>{SUBSCRIPTION_LABELS[subscriptionStatus] ?? humanStatus(subscriptionStatus, 'Unknown')}</dd>
              </div>
              <div>
                <dt>Receptionist</dt>
                <dd>{humanStatus(onboarding?.agent_status, 'Waiting on setup form')}</dd>
              </div>
              <div>
                <dt>Phone number</dt>
                <dd>{humanStatus(onboarding?.phone_status, 'Not attached yet')}</dd>
              </div>
              <div>
                <dt>Phone calls</dt>
                <dd>{onboarding?.channel_voice === false ? 'Off' : 'On'}</dd>
              </div>
              <div>
                <dt>Website chat</dt>
                <dd>{onboarding?.channel_web_chat ? 'On' : 'Off'}</dd>
              </div>
              <div>
                <dt>Texts</dt>
                <dd>Coming soon</dd>
              </div>
            </dl>
          ) : (
            <div className={styles.empty}>
              <p>We do not see a plan for {email || 'this email'} yet.</p>
              <p>Pick a plan (Starter&apos;s first month is $1), or if you checked out with a different email, sign in with that one.</p>
              <Link className={styles.button} href="/pricing#plans">
                See plans
              </Link>
            </div>
          )}
          {greetingEditable ? (
            <p className={styles.help}>
              Test your own Ava in the browser:{' '}
              <a href={`https://elevenlabs.io/app/talk-to?agent_id=${agentId}`} target="_blank" rel="noopener noreferrer">
                talk to your receptionist
              </a>
              . Test calls show up below like real ones.
            </p>
          ) : null}
          <p className={styles.help}>
            Hear how Ava sounds: call the demo line at <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a>.
          </p>
          <p className={styles.help}>
            Need a hand? Call or text Cole at <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>.
          </p>
        </aside>
      </div>

      <section id="calls" className={styles.panel} aria-labelledby="calls-title">
        <div className={styles.panelHead}>
          <h2 id="calls-title">Call history</h2>
          <span className={styles.muted}>
            {callData.total} {callData.total === 1 ? 'call' : 'calls'}
          </span>
        </div>
        {callData.calls.length === 0 ? (
          <p className={styles.empty}>
            No calls yet. Each call Ava answers appears here with Ava’s summary, the transcript, and the recording.
          </p>
        ) : (
          <ul className={styles.calls}>
            {callData.calls.map((call) => {
              const turns = (Array.isArray(call.transcript) ? call.transcript : []).filter((turn) => turn?.message?.trim());
              const lead = call.conversation_id ? leadByConversation.get(call.conversation_id) : undefined;
              const hasRecording = Boolean(call.conversation_id && /^conv_/.test(call.conversation_id));
              return (
                <li key={call.id}>
                  <details>
                    <summary>
                      <span className={styles.callWho}>{call.caller_name || 'Unknown caller'}</span>
                      <span className={styles.callNeed}>{call.service_job_type || (call.summary || '').slice(0, 70)}</span>
                      <span className={styles.callWhen}>
                        {formatTime(call.created_at)}
                        {call.call_duration_secs !== null ? ` · ${formatDuration(call.call_duration_secs)}` : ''}
                      </span>
                      <span className={styles.badge}>{lead ? LEAD_STATUS_LABEL[lead.status] ?? lead.status : 'Call'}</span>
                    </summary>
                    <div className={styles.callBody}>
                      <h3 className={styles.subhead}>Ava’s summary</h3>
                      <p>{call.summary || 'No summary saved for this call.'}</p>
                      <dl className={styles.callFacts}>
                        {call.caller_phone ? (
                          <div>
                            <dt>Phone</dt>
                            <dd>
                              <a href={telHref(call.caller_phone)}>{call.caller_phone}</a>
                            </dd>
                          </div>
                        ) : null}
                        {call.property_address ? (
                          <div>
                            <dt>Address</dt>
                            <dd>{call.property_address}</dd>
                          </div>
                        ) : null}
                        {call.intent_urgency ? (
                          <div>
                            <dt>Urgency</dt>
                            <dd>{call.intent_urgency}</dd>
                          </div>
                        ) : null}
                        {call.call_duration_secs !== null ? (
                          <div>
                            <dt>Length</dt>
                            <dd>{formatDuration(call.call_duration_secs)}</dd>
                          </div>
                        ) : null}
                      </dl>
                      {hasRecording ? (
                        <div className={styles.recording}>
                          <span>Recording</span>
                          <audio controls preload="none" src={`/api/desk/calls/${call.id}/audio`}>
                            <a href={`/api/desk/calls/${call.id}/audio`}>Download the recording</a>
                          </audio>
                        </div>
                      ) : null}
                      {turns.length ? (
                        <details className={styles.transcriptWrap}>
                          <summary>Transcript ({turns.length} turns)</summary>
                          <ol className={styles.transcript} aria-label="Transcript">
                            {turns.map((turn, index) => (
                              <li key={index} className={turn.role === 'user' ? styles.turnCaller : styles.turnAva}>
                                <b>{turn.role === 'user' ? 'Caller' : 'Ava'}</b> {turn.message}
                              </li>
                            ))}
                          </ol>
                        </details>
                      ) : (
                        <p className={styles.muted}>No transcript saved for this call.</p>
                      )}
                      {lead ? (
                        <div className={styles.callFoot}>
                          <LeadActions id={lead.id} current={lead.status} />
                          <Link href={`/dashboard/leads/${lead.id}`}>Notes and history →</Link>
                        </div>
                      ) : null}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
        {callData.total > callData.calls.length && !showAllCalls ? (
          <p className={styles.more}>
            <a href="?calls=all#calls">Show all {Math.min(callData.total, CALLS_ALL)} calls →</a>
          </p>
        ) : null}
      </section>

      <section id="leads" className={styles.panel} aria-labelledby="leads-title">
        <div className={styles.panelHead}>
          <h2 id="leads-title">Leads</h2>
          <Link href="/dashboard/leads">Open the full CRM →</Link>
        </div>
        <div className={styles.filters} role="tablist" aria-label="Lead status">
          {LEAD_FILTERS.map((f) => (
            <a
              key={f.key}
              role="tab"
              aria-selected={leadFilter === f.key}
              className={leadFilter === f.key ? styles.filterOn : styles.filter}
              href={f.key === 'all' ? '?#leads' : `?leads=${encodeURIComponent(f.key)}#leads`}
            >
              {f.label} <span>{leadCounts[f.key]}</span>
            </a>
          ))}
        </div>
        {shownLeads.length === 0 ? (
          <p className={styles.empty}>No leads here yet.</p>
        ) : (
          <ul className={styles.leadList}>
            {shownLeads.slice(0, 100).map((lead) => (
              <li key={lead.id}>
                <div className={styles.leadRow}>
                  <div>
                    <Link href={`/dashboard/leads/${lead.id}`}>
                      <b>{lead.caller_name || 'Unknown caller'}</b>
                    </Link>
                    <span className={styles.muted}> · {formatTime(lead.called_at)}</span>
                    <p>
                      {lead.job_type ? <em>{lead.job_type}. </em> : null}
                      {lead.summary.slice(0, 220)}
                    </p>
                    {lead.caller_phone ? (
                      <a className={styles.callBack} href={telHref(lead.caller_phone)}>
                        {lead.caller_phone}
                      </a>
                    ) : null}
                  </div>
                  <span className={lead.status === 'Booked' ? styles.badgeWon : styles.badge}>
                    {LEAD_STATUS_LABEL[lead.status] ?? lead.status}
                  </span>
                </div>
                <LeadActions id={lead.id} current={lead.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {onboarding && !isStore ? (
        <section id="calendar" className={styles.panel} aria-labelledby="calendar-title">
          <div className={styles.panelHead}>
            <h2 id="calendar-title">Calendar and bookings</h2>
            <span className={styles.badge}>{booking.calendar?.enabled ? 'Ava is booking' : 'Booking off'}</span>
          </div>
          {booking.bookings.length === 0 ? (
            <p className={styles.empty}>
              {booking.calendar?.enabled
                ? 'No bookings in the next two weeks yet. When Ava books a caller, the visit shows up here and in your lead email with an Add to Calendar link.'
                : 'Turn booking on in Settings and Ava will offer callers real open windows and book them during the call.'}
            </p>
          ) : (
            <ul className={styles.calendarDays}>
              {[...bookingDays.entries()].map(([day, rows]) => (
                <li key={day}>
                  <h3>{dayHeading(day)}</h3>
                  <ul className={styles.bookings}>
                    {rows.map((row) => {
                      const links = bookingLinks(row, booking.calendar?.label || 'Ava booking');
                      const windowText = bookingWindowLabel(row, bookingTz).split(', ').slice(2).join(', ');
                      return (
                        <li key={row.id}>
                          <time dateTime={row.start_at}>{windowText}</time>
                          <span>
                            <b>{row.caller_name || 'Caller'}</b>
                            {row.is_demo ? <span className={styles.demoTag}>Demo</span> : null}
                            {row.google_event_id ? <span className={styles.demoTag}>On Google</span> : null}
                            {row.issue ? ` · ${row.issue}` : ''}
                            {row.service_address ? ` · ${row.service_address}` : ''}
                            {row.caller_phone ? (
                              <>
                                {' · '}
                                <a href={telHref(row.caller_phone)}>{row.caller_phone}</a>
                              </>
                            ) : null}
                          </span>
                          <a href={links.googleUrl} target="_blank" rel="noopener noreferrer">
                            Add to Google Calendar
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          {googleStatus ? (
            <p className={styles.googleNote} role="status">
              {googleStatus}
            </p>
          ) : null}
          {googleSyncAvailable && booking.calendar && !booking.calendar.is_demo ? (
            <div className={styles.googleSync}>
              {booking.calendar.google_connected_at ? (
                <>
                  <p>
                    <b>Google Calendar connected.</b> Ava skips your busy times when she offers windows, and each booking
                    lands on your calendar.
                  </p>
                  <form method="post" action="/api/desk/google/disconnect">
                    <button type="submit">Disconnect</button>
                  </form>
                </>
              ) : (
                <>
                  <p>
                    <b>Sync with Google Calendar.</b> Ava will skip times you are busy and add each booking to your calendar.
                    You can disconnect any time.
                  </p>
                  <a href="/api/desk/google/connect">Connect Google Calendar</a>
                </>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      <section id="billing" className={styles.panel} aria-labelledby="billing-title">
        <div className={styles.panelHead}>
          <h2 id="billing-title">Plan and billing</h2>
          {subscriptionStatus ? (
            <span className={styles.badge}>{SUBSCRIPTION_LABELS[subscriptionStatus] ?? humanStatus(subscriptionStatus, '')}</span>
          ) : null}
        </div>
        <div className={styles.billingGrid}>
          <div>
            <p className={styles.planName}>
              {plan ? (
                <>
                  <b>{plan.label}</b> · {plan.monthlyLabel}/month · {plan.minutesLabel}
                </>
              ) : (
                <b>No plan yet</b>
              )}
            </p>
            {renewal ? <p className={styles.muted}>{renewal}</p> : null}
            <div className={styles.meter} aria-label="Minutes used">
              <div className={styles.meterHead}>
                <span>
                  <b>{usage.used.toLocaleString('en-US')}</b> of {usage.included.toLocaleString('en-US')} minutes used
                </span>
                <span>{usage.percent}%</span>
              </div>
              <div
                className={styles.meterBar}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={usage.percent}
              >
                <i style={{ width: `${usage.percent}%` }} className={usage.over ? styles.meterOver : undefined} />
              </div>
              <small>
                {windowLabel}. {usageData.calls} {usageData.calls === 1 ? 'call' : 'calls'}, counted from real call lengths
                {usageData.unknown ? ` (${usageData.unknown} without a recorded length yet)` : ''}.
                {usage.over ? ' You are past your included minutes; Ava keeps answering and we will reach out about a bigger plan.' : ''}
              </small>
            </div>
          </div>
          <div className={styles.billingActions}>
            {customer?.stripe_customer_id ? (
              <form method="post" action="/api/desk/billing/portal">
                <button type="submit" className={styles.button}>
                  Manage billing
                </button>
                <small>Change plan, update your card, or download invoices in Stripe’s secure portal.</small>
              </form>
            ) : (
              <>
                <Link className={styles.button} href="/pricing#plans">
                  {customer ? 'See plans' : 'Pick a plan'}
                </Link>
                <small>
                  {customer
                    ? 'Billing management opens here once your plan is billed through Stripe. To change plans now, call '
                    : 'Starter’s first month is $1. Questions? Call '}
                  <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>.
                </small>
              </>
            )}
          </div>
        </div>
      </section>

      <section id="settings" className={styles.panel} aria-labelledby="settings-title">
        <div className={styles.panelHead}>
          <h2 id="settings-title">Settings</h2>
        </div>
        {onboarding ? (
          <>
            <DeskSettings
              greeting={greeting}
              greetingEditable={greetingEditable}
              notificationEmail={onboarding.staff_email || email}
              businessHours={onboarding.business_hours || ''}
            />
            {!isStore ? (
              <details className={styles.settingsWrap} id="booking-settings">
                <summary>Booking: {booking.calendar?.enabled ? 'on' : 'off'}. Change booking settings</summary>
                <BookingSettings
                  enabled={Boolean(booking.calendar?.enabled)}
                  isDemo={Boolean(booking.calendar?.is_demo)}
                  slotMinutes={booking.calendar?.slot_minutes ?? 120}
                  slotCapacity={booking.calendar?.slot_capacity ?? 1}
                  minNoticeMinutes={booking.calendar?.min_notice_minutes ?? 120}
                  horizonDays={booking.calendar?.horizon_days ?? 14}
                  weeklyHours={booking.calendar?.weekly_hours ?? DEFAULT_WEEKLY_HOURS}
                  blackouts={booking.calendar?.blackouts ?? []}
                />
              </details>
            ) : null}
          </>
        ) : (
          <p className={styles.empty}>Settings open once your receptionist setup form is in.</p>
        )}
      </section>

      <section id="texts" className={styles.panel} aria-labelledby="texts-title">
        <div className={styles.panelHead}>
          <h2 id="texts-title">Texts</h2>
          <span className={styles.badgeSoon}>Coming soon</span>
        </div>
        <p className={styles.empty}>
          Texting with callers is coming soon. We are waiting on carrier approval for business texting, and nothing is
          sent by text until it is approved. Calls, leads, and email alerts work today.
        </p>
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
