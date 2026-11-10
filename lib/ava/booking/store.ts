import { createAdminClient } from '@/lib/supabase/admin';
import type { Blackout, CalendarSettings, WeeklyHours } from '@/lib/ava/booking/slots';
import { hashToolSecret } from '@/lib/ava/booking/secret';

export type CalendarRow = {
  id: string;
  onboarding_id: string | null;
  label: string;
  is_demo: boolean;
  enabled: boolean;
  timezone: string;
  slot_minutes: number;
  slot_capacity: number;
  min_notice_minutes: number;
  horizon_days: number;
  weekly_hours: WeeklyHours;
  blackouts: Blackout[];
  tool_secret_hash: string | null;
  elevenlabs_tool_ids: string[] | null;
};

export type BookingRow = {
  id: string;
  calendar_id: string;
  start_at: string;
  end_at: string;
  status: 'booked' | 'canceled';
  caller_name: string | null;
  caller_phone: string | null;
  service_address: string | null;
  issue: string | null;
  conversation_id: string | null;
  is_demo: boolean;
  created_at: string;
};

const CALENDAR_SELECT =
  'id, onboarding_id, label, is_demo, enabled, timezone, slot_minutes, slot_capacity, min_notice_minutes, horizon_days, weekly_hours, blackouts, tool_secret_hash, elevenlabs_tool_ids';

export function settingsOf(row: CalendarRow): CalendarSettings {
  return {
    timezone: row.timezone || 'America/Chicago',
    slotMinutes: row.slot_minutes,
    slotCapacity: row.slot_capacity,
    minNoticeMinutes: row.min_notice_minutes,
    horizonDays: row.horizon_days,
    weeklyHours: (row.weekly_hours ?? {}) as WeeklyHours,
    blackouts: Array.isArray(row.blackouts) ? row.blackouts : [],
  };
}

/** The calendar a tool secret belongs to. Returns null for unknown or disabled calendars. */
export async function calendarForToolSecret(secret: string) {
  if (!secret || secret.length < 20) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_calendars')
    .select(CALENDAR_SELECT)
    .eq('tool_secret_hash', hashToolSecret(secret))
    .maybeSingle();
  if (error) throw new Error(`Unable to load calendar: ${error.message}`);
  const row = data as CalendarRow | null;
  return row && row.enabled ? row : null;
}

export async function calendarForOnboarding(onboardingId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_calendars')
    .select(CALENDAR_SELECT)
    .eq('onboarding_id', onboardingId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load calendar: ${error.message}`);
  return (data as CalendarRow | null) ?? null;
}

export async function saveCalendarForOnboarding(onboardingId: string, patch: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_calendars')
    .upsert({ onboarding_id: onboardingId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'onboarding_id' })
    .select(CALENDAR_SELECT)
    .single();
  if (error) throw new Error(`Unable to save calendar: ${error.message}`);
  return data as CalendarRow;
}

export async function listBookings(calendarId: string, fromIso: string, toIso: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_bookings')
    .select('*')
    .eq('calendar_id', calendarId)
    .eq('status', 'booked')
    .lt('start_at', toIso)
    .gt('end_at', fromIso)
    .order('start_at', { ascending: true })
    .limit(500);
  if (error) throw new Error(`Unable to load bookings: ${error.message}`);
  return (data ?? []) as BookingRow[];
}

export async function insertBooking(row: Omit<BookingRow, 'id' | 'created_at' | 'status'>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('ava_bookings').insert({ ...row, status: 'booked' }).select('*').single();
  if (error) throw new Error(`Unable to save booking: ${error.message}`);
  return data as BookingRow;
}

export async function cancelBooking(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('ava_bookings').update({ status: 'canceled' }).eq('id', id);
  if (error) throw new Error(`Unable to cancel booking: ${error.message}`);
}

/** Bookings in the same slot, oldest first: used to undo an over-capacity race. */
export async function bookingsInSlot(calendarId: string, startIso: string, endIso: string) {
  return listBookings(calendarId, startIso, endIso);
}

export async function bookingForConversation(conversationId: string) {
  if (!conversationId) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_bookings')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('status', 'booked')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw new Error(`Unable to load booking: ${error.message}`);
  return ((data ?? [])[0] as BookingRow | undefined) ?? null;
}

export async function getBooking(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('ava_bookings').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Unable to load booking: ${error.message}`);
  return (data as BookingRow | null) ?? null;
}

export async function getCalendar(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('ava_calendars').select(CALENDAR_SELECT).eq('id', id).maybeSingle();
  if (error) throw new Error(`Unable to load calendar: ${error.message}`);
  return (data as CalendarRow | null) ?? null;
}
