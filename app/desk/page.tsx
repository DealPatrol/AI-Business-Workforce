import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { AVA_OFFER, AVA_PLANS, isAvaPlanKey } from '@/lib/ava/pricing';
import { AVA_STORE_OFFER, STORE_PLAN_KEY, storeMonthlyEstimateCents } from '@/lib/ava/store-pricing';
import { DESK_TOOLS } from '@/lib/desk-tools';
import { clientIdsForOwnerEmail, listLeadsForOwner } from '@/lib/leads/store';
import type { ErLead } from '@/lib/leads/types';
import { metadataTitle, pageSeo } from '@/lib/seo/pages';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { bookingLinks, bookingWindowLabel } from '@/lib/ava/booking/event';
import { DEFAULT_WEEKLY_HOURS, localDateOf } from '@/lib/ava/booking/slots';
import { calendarForOnboarding, listBookings, type BookingRow, type CalendarRow } from '@/lib/ava/booking/store';
import { BookingSettings } from './booking-settings';
import { googleCalendarConfig, isGoogleLinked } from '@/lib/ava/booking/google';

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
  elevenlabs_agent_id: string | null;
};

type CallDetail = {
  conversation_id: string;
  property_address: string | null;
  intent_urgency: string | null;
  transcript: Array<{ role?: string; message?: string }> | null;
};

/** Transcripts saved by the post-call webhook, keyed by conversation id. Never throws. */
async function loadCallDetails(conversationIds: string[]) {
  const ids = conversationIds.filter(Boolean);
  const details = new Map<string, CallDetail>();
  if (!ids.length) return details;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('ava_call_leads')
      .select('conversation_id, property_address, intent_urgency, transcript')
      .in('conversation_id', ids);
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as CallDetail[]) details.set(row.conversation_id, row);
  } catch (error) {
    console.error('Desk could not load call transcripts', error);
  }
  return details;
}

/** The owner's booking calendar and the next two weeks of bookings. Never throws. */
async function loadBookingCalendar(onboardingId: string | null | undefined) {
  if (!onboardingId) return { calendar: null as CalendarRow | null, bookings: [] as BookingRow[] };
  try {
    const calendar = await calendarForOnboarding(onboardingId);
    if (!calendar) return { calendar: null, bookings: [] };
    const now = new Date();
    const until = new Date(now.getTime() + 15 * 86_400_000);
    const bookings = await listBookings(calendar.id, new Date(now.getTime() - 86_400_000).toISOString(), until.toISOString());
    return { calendar, bookings };
  } catch (error) {
    console.error('Desk could not load the booking calendar', error);
    return { calendar: null, bookings: [] };
  }
}

function dayHeading(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Calls the store plan bills for: excludes calls Ava itself flagged as spam or a wrong number. */
function isBillableStoreCall(lead: ErLead) {
  return Boolean(lead.conversation_id) && !lead.notes?.startsWith('Ava marked this call as');
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
  trialing: 'Trial running',
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
      .select('id, business_name, agent_status, phone_status, channel_voice, channel_sms, channel_web_chat, elevenlabs_agent_id')
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

export default async function DeskPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = (await searchParams) ?? {};
  const googleStatus = typeof query.google === 'string' ? GOOGLE_STATUS[query.google] ?? '' : '';
  const googleSyncAvailable = Boolean(googleCalendarConfig());
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
  const flatPlan = customer?.plan && isAvaPlanKey(customer.plan) ? AVA_PLANS[customer.plan] : null;
  const storeTrial = isStore && customer?.subscription_status === 'trialing';
  const callsThisMonth = leads.filter(
    (lead) => isBillableStoreCall(lead) && lead.created_at && new Date(lead.created_at) >= monthStart,
  ).length;
  const billedThisMonth = isStore
    ? storeTrial
      ? 0
      : storeMonthlyEstimateCents(callsThisMonth) / 100
    : flatPlan
      ? flatPlan.monthlyCents / 100
      : 0;
  const recent = leads.slice(0, 8);
  const callDetails = await loadCallDetails(recent.map((lead) => lead.conversation_id || ''));
  const booking = isStore ? { calendar: null, bookings: [] as BookingRow[] } : await loadBookingCalendar(onboarding?.id);
  const bookingTz = booking.calendar?.timezone || 'America/Chicago';
  const bookingDays = new Map<string, BookingRow[]>();
  for (const row of booking.bookings) {
    const day = localDateOf(new Date(row.start_at), bookingTz).date;
    bookingDays.set(day, [...(bookingDays.get(day) ?? []), row]);
  }
  const testAgentId = /^agent_[a-z0-9]+$/i.test(onboarding?.elevenlabs_agent_id || '') ? onboarding?.elevenlabs_agent_id : '';

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
        <article><small>Billed this month (est.)</small><b>${billedThisMonth}</b><span>{isStore ? (storeTrial ? 'Free during your trial' : `${AVA_STORE_OFFER.monthlyLabel} + ${AVA_STORE_OFFER.perCallLabel} × ${callsThisMonth} calls`) : flatPlan ? `${flatPlan.label}: ${flatPlan.minutesLabel}/month` : 'No plan yet'}</span></article>
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
              <p>We do not see a plan for {email || 'this email'} yet.</p>
              <p>
                Pick a plan (Starter&apos;s first month is $1), or if you checked out with a different email, sign in with that one.
              </p>
              <Link className={styles.button} href="/pricing#plans">See plans</Link>
            </div>
          )}
          <p className={styles.help}>
            Want to change Ava’s greeting, questions, hours, or channels? Call or text Cole at{' '}
            <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>.
          </p>
          {testAgentId ? (
            <p className={styles.help}>
              Test your own Ava in the browser:{' '}
              <a href={`https://elevenlabs.io/app/talk-to?agent_id=${testAgentId}`} target="_blank" rel="noopener noreferrer">
                talk to your receptionist
              </a>
              . Test calls show up below like real ones.
            </p>
          ) : null}
          <p className={styles.help}>
            Hear how Ava sounds: call the demo line at <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a>.
          </p>
        </aside>
      </div>

      <section className={styles.panel} aria-labelledby="recent">
        <div className={styles.panelHead}>
          <h2 id="recent">Recent calls</h2>
          <Link href="/dashboard/leads">Open the CRM →</Link>
        </div>
        {recent.length === 0 ? (
          <p className={styles.empty}>No calls yet. Your first caller will appear here with a summary, the transcript, and the recording.</p>
        ) : (
          <ul className={styles.calls}>
            {recent.map((lead) => {
              const detail = lead.conversation_id ? callDetails.get(lead.conversation_id) : undefined;
              const turns = (detail?.transcript ?? []).filter((turn) => turn?.message?.trim());
              return (
                <li key={lead.id}>
                  <details>
                    <summary>
                      <span className={styles.callWho}>{lead.caller_name || 'Unknown caller'}</span>
                      <span className={styles.callNeed}>{lead.job_type || lead.summary.slice(0, 70)}</span>
                      <span className={styles.callWhen}>{formatTime(lead.called_at)}</span>
                      <span className={styles.badge}>{lead.status}</span>
                    </summary>
                    <div className={styles.callBody}>
                      <p>{lead.summary}</p>
                      <dl className={styles.callFacts}>
                        {lead.caller_phone ? (
                          <div><dt>Phone</dt><dd><a href={`tel:${lead.caller_phone.replace(/[^\d+]/g, '')}`}>{lead.caller_phone}</a></dd></div>
                        ) : null}
                        {detail?.property_address ? <div><dt>Address</dt><dd>{detail.property_address}</dd></div> : null}
                        {detail?.intent_urgency ? <div><dt>Urgency</dt><dd>{detail.intent_urgency}</dd></div> : null}
                      </dl>
                      {lead.conversation_id && /^conv_/.test(lead.conversation_id) ? (
                        <div className={styles.recording}>
                          <span>Recording</span>
                          <audio controls preload="none" src={`/api/desk/calls/${lead.id}/audio`}>
                            <a href={`/api/desk/calls/${lead.id}/audio`}>Download the recording</a>
                          </audio>
                        </div>
                      ) : null}
                      {turns.length ? (
                        <ol className={styles.transcript} aria-label="Transcript">
                          {turns.map((turn, index) => (
                            <li key={index} className={turn.role === 'user' ? styles.turnCaller : styles.turnAva}>
                              <b>{turn.role === 'user' ? 'Caller' : 'Ava'}</b> {turn.message}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className={styles.muted}>No transcript saved for this lead.</p>
                      )}
                      <div className={styles.callFoot}>
                        {lead.status === 'New' ? <LeadActions id={lead.id} store={isStore} /> : null}
                        <Link href={`/dashboard/leads/${lead.id}`}>Notes and history →</Link>
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {onboarding && !isStore ? (
        <section className={styles.panel} aria-labelledby="calendar">
          <div className={styles.panelHead}>
            <h2 id="calendar">Booking calendar</h2>
            <span className={styles.badge}>{booking.calendar?.enabled ? 'Ava is booking' : 'Booking off'}</span>
          </div>
          {booking.bookings.length === 0 ? (
            <p className={styles.empty}>
              {booking.calendar?.enabled
                ? 'No bookings in the next two weeks yet. When Ava books a caller, the visit shows up here and in your lead email with an Add to Calendar link.'
                : 'Turn booking on below and Ava will offer callers real open windows and book them during the call.'}
            </p>
          ) : (
            <ul className={styles.calendarDays}>
              {[...bookingDays.entries()].map(([day, rows]) => (
                <li key={day}>
                  <h3>{dayHeading(day)}</h3>
                  <ul className={styles.bookings}>
                    {rows.map((row) => {
                      const links = bookingLinks(row, booking.calendar?.label || 'Ava booking');
                      const window = bookingWindowLabel(row, bookingTz).split(', ').slice(2).join(', ');
                      return (
                        <li key={row.id}>
                          <time dateTime={row.start_at}>{window}</time>
                          <span>
                            <b>{row.caller_name || 'Caller'}</b>
                            {row.is_demo ? <span className={styles.demoTag}>Demo</span> : null}
                            {row.google_event_id ? <span className={styles.demoTag}>On Google</span> : null}
                            {row.issue ? ` · ${row.issue}` : ''}
                            {row.service_address ? ` · ${row.service_address}` : ''}
                            {row.caller_phone ? (
                              <>
                                {' · '}
                                <a href={`tel:${row.caller_phone.replace(/[^\d+]/g, '')}`}>{row.caller_phone}</a>
                              </>
                            ) : null}
                          </span>
                          <a href={links.googleUrl} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>
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
          {googleSyncAvailable && !booking.calendar?.is_demo ? (
            <div className={styles.googleSync}>
              {isGoogleLinked(booking.calendar) ? (
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
                    <b>Sync with Google Calendar.</b> Ava will skip times you are busy and add each booking to your
                    calendar. You can disconnect any time.
                  </p>
                  <a href="/api/desk/google/connect">Connect Google Calendar</a>
                </>
              )}
            </div>
          ) : null}
          <details className={styles.settingsWrap}>
            <summary>Booking settings</summary>
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
        </section>
      ) : null}

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
