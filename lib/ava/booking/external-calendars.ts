/**
 * Cal.com and Calendly as busy-time sources: appointments booked through those tools block the same
 * time in Ava's calendar, so she never double-books. Read-only; Ava's own bookings stay in the Desk
 * (and Google, when linked). Tokens are stored encrypted and never returned to the browser.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { BookedRange } from '@/lib/ava/booking/slots';

export type ExternalProvider = 'calcom' | 'calendly';

export type ExternalCalendarLink = {
  external_calendar_provider: ExternalProvider | null;
  external_calendar_token_enc: string | null;
  external_calendar_connected_at: string | null;
  external_calendar_last_error: string | null;
};

export function isExternalProvider(value: unknown): value is ExternalProvider {
  return value === 'calcom' || value === 'calendly';
}

export const EXTERNAL_PROVIDER_LABELS: Record<ExternalProvider, string> = { calcom: 'Cal.com', calendly: 'Calendly' };

const CALCOM_API = 'https://api.cal.com/v2';
const CALENDLY_API = 'https://api.calendly.com';
const WEEK_MS = 7 * 86_400_000;

async function json(response: Response) {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

/** Upcoming accepted/pending Cal.com bookings overlapping the range. */
export async function calcomBusyRanges(apiKey: string, fromIso: string, toIso: string, fetchImpl: typeof fetch = fetch): Promise<BookedRange[]> {
  const qs = new URLSearchParams({ afterStart: fromIso, beforeEnd: toIso, take: '100' });
  const response = await fetchImpl(`${CALCOM_API}/bookings?${qs}`, {
    headers: { Authorization: `Bearer ${apiKey}`, 'cal-api-version': '2024-08-13' },
    cache: 'no-store',
  });
  const data = await json(response);
  if (!response.ok) throw new Error(`Cal.com bookings failed (${response.status}).`);
  const rows = Array.isArray(data.data) ? (data.data as Array<Record<string, unknown>>) : [];
  return rows
    .filter((b) => !['cancelled', 'canceled', 'rejected'].includes(String(b.status || '').toLowerCase()))
    .map((b) => ({ start_at: String(b.start || b.startTime || ''), end_at: String(b.end || b.endTime || '') }))
    .filter((b) => b.start_at && b.end_at);
}

async function calendlyUserUri(token: string, fetchImpl: typeof fetch) {
  const response = await fetchImpl(`${CALENDLY_API}/users/me`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  const data = await json(response);
  if (!response.ok) throw new Error(`Calendly sign-in failed (${response.status}).`);
  const uri = (data.resource as Record<string, unknown> | undefined)?.uri;
  if (typeof uri !== 'string') throw new Error('Calendly did not return a user.');
  return uri;
}

/** Calendly busy times (scheduled events plus connected calendars). The API takes at most 7 days per request. */
export async function calendlyBusyRanges(token: string, fromIso: string, toIso: string, fetchImpl: typeof fetch = fetch): Promise<BookedRange[]> {
  const user = await calendlyUserUri(token, fetchImpl);
  const out: BookedRange[] = [];
  let start = Date.parse(fromIso);
  const end = Date.parse(toIso);
  while (start < end) {
    const stop = Math.min(start + WEEK_MS - 60_000, end);
    const qs = new URLSearchParams({ user, start_time: new Date(start).toISOString(), end_time: new Date(stop).toISOString() });
    const response = await fetchImpl(`${CALENDLY_API}/user_busy_times?${qs}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const data = await json(response);
    if (!response.ok) throw new Error(`Calendly busy times failed (${response.status}).`);
    for (const row of Array.isArray(data.collection) ? (data.collection as Array<Record<string, unknown>>) : []) {
      if (typeof row.start_time === 'string' && typeof row.end_time === 'string') out.push({ start_at: row.start_time, end_at: row.end_time });
    }
    start = stop;
  }
  return out;
}

export function externalBusyRanges(provider: ExternalProvider, token: string, fromIso: string, toIso: string, fetchImpl: typeof fetch = fetch) {
  return provider === 'calcom' ? calcomBusyRanges(token, fromIso, toIso, fetchImpl) : calendlyBusyRanges(token, fromIso, toIso, fetchImpl);
}

/** Checks a pasted token works before saving it. */
export async function verifyExternalToken(provider: ExternalProvider, token: string, fetchImpl: typeof fetch = fetch) {
  const now = new Date();
  await externalBusyRanges(provider, token, now.toISOString(), new Date(now.getTime() + 86_400_000).toISOString(), fetchImpl);
}

const SELECT = 'external_calendar_provider, external_calendar_token_enc, external_calendar_connected_at, external_calendar_last_error';

/** The calendar's Cal.com/Calendly link, or null. Null too when the migration has not been applied yet. */
export async function externalCalendarFor(calendarId: string): Promise<ExternalCalendarLink | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('ava_calendars').select(SELECT).eq('id', calendarId).maybeSingle();
    if (error || !data) return null;
    const row = data as ExternalCalendarLink;
    return row.external_calendar_provider && row.external_calendar_token_enc ? row : null;
  } catch {
    return null;
  }
}

export async function saveExternalCalendar(calendarId: string, patch: Partial<ExternalCalendarLink>) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('ava_calendars').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', calendarId);
  if (error) throw new Error(`Unable to save calendar link: ${error.message}`);
}
