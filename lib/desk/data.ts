/**
 * Desk data loaders. Every read goes through the signed-in owner's Supabase session, so
 * row-level security (supabase/migrations/20261112220000_desk_rls.sql) limits it to their own rows.
 * Columns are listed explicitly: secret columns are not granted to signed-in users.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Blackout, WeeklyHours } from '@/lib/ava/booking/slots';
import type { ErLead } from '@/lib/leads/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { conversationDurations } from './eleven';

export type DeskCustomer = {
  id: string;
  business_name: string | null;
  subscription_status: string | null;
  onboarding_id: string | null;
  plan: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string | null;
};

export type DeskOnboarding = {
  id: string;
  business_name: string | null;
  business_hours: string | null;
  staff_email: string | null;
  selected_plan: string | null;
  elevenlabs_agent_id: string | null;
  agent_status: string | null;
  phone_status: string | null;
  phone_number: string | null;
  channel_voice: boolean | null;
  channel_sms: boolean | null;
  channel_web_chat: boolean | null;
};

export type DeskCall = {
  id: string;
  conversation_id: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  service_job_type: string | null;
  property_address: string | null;
  intent_urgency: string | null;
  summary: string | null;
  transcript: Array<{ role?: string; message?: string }> | null;
  call_duration_secs: number | null;
  created_at: string;
};

export type DeskCalendar = {
  id: string;
  label: string | null;
  is_demo: boolean;
  enabled: boolean;
  timezone: string | null;
  slot_minutes: number | null;
  slot_capacity: number | null;
  min_notice_minutes: number | null;
  horizon_days: number | null;
  weekly_hours: WeeklyHours | null;
  blackouts: Blackout[] | null;
  google_connected_at: string | null;
};

export type DeskBooking = {
  id: string;
  calendar_id: string;
  conversation_id: string | null;
  created_at: string;
  start_at: string;
  end_at: string;
  status: 'booked' | 'canceled';
  caller_name: string | null;
  caller_phone: string | null;
  service_address: string | null;
  issue: string | null;
  is_demo: boolean;
  google_event_id: string | null;
};

const CUSTOMER_COLUMNS =
  'id, business_name, subscription_status, onboarding_id, plan, stripe_customer_id, stripe_subscription_id, created_at';
const ONBOARDING_COLUMNS =
  'id, business_name, business_hours, staff_email, selected_plan, elevenlabs_agent_id, agent_status, phone_status, phone_number, channel_voice, channel_sms, channel_web_chat';
export const CALL_COLUMNS =
  'id, conversation_id, caller_name, caller_phone, service_job_type, property_address, intent_urgency, summary, transcript, call_duration_secs, created_at';
const CALENDAR_COLUMNS =
  'id, label, is_demo, enabled, timezone, slot_minutes, slot_capacity, min_notice_minutes, horizon_days, weekly_hours, blackouts, google_connected_at';
const BOOKING_COLUMNS =
  'id, calendar_id, conversation_id, created_at, start_at, end_at, status, caller_name, caller_phone, service_address, issue, is_demo, google_event_id';
const LEAD_COLUMNS =
  'id, client_id, business_id, owner_id, caller_name, caller_phone, job_type, summary, called_at, source, status, notes, booked_at, billed_at, billing_skipped, billing_skip_reason, conversation_id, created_at, updated_at';

function fail(what: string, message: string): never {
  throw new Error(`Desk could not load ${what}: ${message}`);
}

export async function loadDeskAccount(supabase: SupabaseClient) {
  const { data: customers, error } = await supabase
    .from('ava_customers')
    .select(CUSTOMER_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) fail('the account', error.message);
  const rows = (customers ?? []) as DeskCustomer[];
  const customer = rows.find((row) => row.onboarding_id) ?? rows[0] ?? null;
  let onboarding: DeskOnboarding | null = null;
  if (customer?.onboarding_id) {
    const { data, error: onboardingError } = await supabase
      .from('ava_onboardings')
      .select(ONBOARDING_COLUMNS)
      .eq('id', customer.onboarding_id)
      .maybeSingle();
    if (onboardingError) fail('the receptionist setup', onboardingError.message);
    onboarding = (data as DeskOnboarding | null) ?? null;
  }
  return { customer, onboarding };
}

export async function loadDeskLeads(supabase: SupabaseClient, limit = 200) {
  const { data, error } = await supabase
    .from('er_leads')
    .select(LEAD_COLUMNS)
    .order('called_at', { ascending: false })
    .limit(limit);
  if (error) fail('leads', error.message);
  return (data ?? []) as ErLead[];
}

export async function loadDeskCalls(supabase: SupabaseClient, onboardingId: string, limit: number) {
  const { data, error, count } = await supabase
    .from('ava_call_leads')
    .select(CALL_COLUMNS, { count: 'exact' })
    .eq('onboarding_id', onboardingId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) fail('calls', error.message);
  return { calls: (data ?? []) as DeskCall[], total: count ?? (data ?? []).length };
}

/**
 * Seconds of every call since `since`. Calls saved before durations were recorded are looked up
 * once from ElevenLabs and written back (at most 25 per page load), so the meter uses real lengths.
 */
export async function loadUsageSeconds(supabase: SupabaseClient, onboardingId: string, since: Date) {
  const { data, error } = await supabase
    .from('ava_call_leads')
    .select('id, conversation_id, call_duration_secs')
    .eq('onboarding_id', onboardingId)
    .gte('created_at', since.toISOString())
    .limit(5000);
  if (error) fail('usage', error.message);
  const rows = (data ?? []) as Array<{ id: string; conversation_id: string | null; call_duration_secs: number | null }>;
  const missing = rows.filter((row) => row.call_duration_secs === null && row.conversation_id);
  let unknown = 0;
  if (missing.length) {
    const found = await conversationDurations(missing.map((row) => row.conversation_id as string));
    const admin = found.size ? createAdminClient() : null;
    for (const row of missing) {
      const secs = found.get(row.conversation_id as string);
      if (secs === undefined) {
        unknown += 1;
        continue;
      }
      row.call_duration_secs = secs;
      await admin
        ?.from('ava_call_leads')
        .update({ call_duration_secs: secs })
        .eq('id', row.id)
        .is('call_duration_secs', null)
        .then(({ error: updateError }) => {
          if (updateError) console.error('Desk could not save a call length', updateError.message);
        });
    }
  }
  return { seconds: rows.map((row) => row.call_duration_secs), calls: rows.length, unknown };
}

export async function loadDeskCalendar(supabase: SupabaseClient, onboardingId: string, fromIso: string, toIso: string) {
  const { data: calendar, error } = await supabase
    .from('ava_calendars')
    .select(CALENDAR_COLUMNS)
    .eq('onboarding_id', onboardingId)
    .maybeSingle();
  if (error) fail('the calendar', error.message);
  if (!calendar) return { calendar: null, bookings: [] as DeskBooking[] };
  const { data: bookings, error: bookingError } = await supabase
    .from('ava_bookings')
    .select(BOOKING_COLUMNS)
    .eq('calendar_id', (calendar as DeskCalendar).id)
    .eq('status', 'booked')
    .lt('start_at', toIso)
    .gt('end_at', fromIso)
    .order('start_at', { ascending: true })
    .limit(200);
  if (bookingError) fail('bookings', bookingError.message);
  return { calendar: calendar as DeskCalendar, bookings: (bookings ?? []) as DeskBooking[] };
}
