/**
 * Hosted booking page for an Ava calendar: customers pick an open window online, get a confirmation
 * email with a link to reschedule or cancel (no login), and the owner gets an email. Same calendar,
 * same open-window rules, and same Google/Cal.com/Calendly busy checks as phone bookings, so online
 * and phone bookings never double-book. No texts are sent.
 */
import { outsideBusy, runAfterBook } from '@/lib/ava/booking/after-book';
import { bookingWindowLabel } from '@/lib/ava/booking/event';
import { bookingLinkToken, verifyBookingLinkToken } from '@/lib/ava/booking/ics';
import { computeOpenSlots, type BookedRange, type OpenSlot } from '@/lib/ava/booking/slots';
import {
  bookingsInSlot,
  businessNameForCalendar,
  cancelBooking,
  listBookings,
  moveBooking,
  settingsOf,
  updateBookingSync,
  type BookingRow,
  type CalendarRow,
} from '@/lib/ava/booking/store';
import { escapeHtml, sendResendEmail } from '@/lib/ava/mail';
import { EXECUTIVE_RECEPTIONIST_ORIGIN } from '@/lib/site-url';
import { createAdminClient } from '@/lib/supabase/admin';

export function calendarPublicToken(calendarId: string) {
  return bookingLinkToken(`calendar:${calendarId}`);
}

export function verifyCalendarPublicToken(calendarId: string, token: string) {
  return verifyBookingLinkToken(`calendar:${calendarId}`, token);
}

export function publicBookingUrl(calendarId: string) {
  const t = calendarPublicToken(calendarId);
  return t ? `${EXECUTIVE_RECEPTIONIST_ORIGIN}/schedule/${calendarId}?t=${t}` : '';
}

export function manageBookingUrl(bookingId: string) {
  const t = bookingLinkToken(bookingId);
  return t ? `${EXECUTIVE_RECEPTIONIST_ORIGIN}/schedule/manage/${bookingId}?t=${t}` : '';
}

export type PublicDeps = {
  list: (calendarId: string, fromIso: string, toIso: string) => Promise<BookedRange[]>;
  busy: (calendar: CalendarRow, fromIso: string, toIso: string) => Promise<BookedRange[]>;
};

const defaultDeps: PublicDeps = {
  list: (id, from, to) => listBookings(id, from, to),
  busy: (calendar, from, to) => outsideBusy(calendar, from, to),
};

export async function publicOpenSlots(calendar: CalendarRow, now = new Date(), deps: PublicDeps = defaultDeps, ignoreId?: string): Promise<OpenSlot[]> {
  const settings = settingsOf(calendar);
  const fromIso = now.toISOString();
  const toIso = new Date(now.getTime() + (settings.horizonDays + 1) * 86_400_000).toISOString();
  const [booked, busy] = await Promise.all([deps.list(calendar.id, fromIso, toIso), deps.busy(calendar, fromIso, toIso)]);
  const others = booked.filter((b) => (b as Partial<BookingRow>).id !== ignoreId);
  return computeOpenSlots(settings, others, now, busy);
}

export type PublicBookingInput = {
  slotStart: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  issue: string;
};

function str(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function cleanPublicBookingInput(body: Record<string, unknown>): PublicBookingInput | { error: string } {
  const input = {
    slotStart: str(body.slot_start, 40),
    name: str(body.name, 120),
    phone: str(body.phone, 40),
    email: str(body.email, 200).toLowerCase(),
    address: str(body.address, 300),
    issue: str(body.issue, 500),
  };
  if (!input.slotStart) return { error: 'Pick a time.' };
  if (!input.name) return { error: 'Add your name.' };
  if (input.phone.replace(/\D/g, '').length < 10) return { error: 'Add a phone number with area code.' };
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return { error: 'Check the email address.' };
  return input;
}

async function insertOnlineBooking(row: Omit<BookingRow, 'id' | 'created_at' | 'status'> & { caller_email?: string | null }) {
  const supabase = createAdminClient();
  let result = await supabase.from('ava_bookings').insert({ ...row, status: 'booked' }).select('*').single();
  if (result.error && /caller_email/i.test(result.error.message)) {
    // Before the caller_email migration: keep the booking, the email still goes out from the form value.
    const { caller_email: _drop, ...rest } = row;
    void _drop;
    result = await supabase.from('ava_bookings').insert({ ...rest, status: 'booked' }).select('*').single();
  }
  if (result.error) throw new Error(`Unable to save booking: ${result.error.message}`);
  return result.data as BookingRow;
}

async function ownerEmailFor(calendar: CalendarRow) {
  if (!calendar.onboarding_id) return '';
  try {
    const { data } = await createAdminClient().from('ava_onboardings').select('staff_email').eq('id', calendar.onboarding_id).maybeSingle();
    return String((data as { staff_email?: string } | null)?.staff_email || '');
  } catch {
    return '';
  }
}

function emailShell(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1c140e"><h1 style="font-size:22px">${title}</h1>${body}<p style="color:#5b4f45;font-size:12px">Sent by Executive Receptionist on behalf of the business.</p></div>`;
}

export async function sendPublicBookingEmails(
  kind: 'booked' | 'moved' | 'canceled',
  calendar: CalendarRow,
  booking: BookingRow,
  customerEmail: string,
  send: typeof sendResendEmail = sendResendEmail,
) {
  const business = (await businessNameForCalendar(calendar)) || 'the business';
  const window = bookingWindowLabel(booking, calendar.timezone || 'America/Chicago');
  const manage = manageBookingUrl(booking.id);
  const verb = kind === 'booked' ? 'is booked' : kind === 'moved' ? 'was moved' : 'was canceled';
  const tasks: Promise<unknown>[] = [];
  if (customerEmail) {
    tasks.push(
      send({
        to: customerEmail,
        subject: `${business}: your appointment ${verb}`,
        html: emailShell(
          `Your appointment ${verb}`,
          `<p><b>${escapeHtml(business)}</b><br>${escapeHtml(window)}</p><p>This is an arrival window. The team will confirm before the visit.</p>${
            kind !== 'canceled' && manage ? `<p><a href="${escapeHtml(manage)}">Reschedule or cancel</a></p>` : ''
          }`,
        ),
      }).catch((e) => console.error('Customer booking email failed', e instanceof Error ? e.message : e)),
    );
  }
  const owner = await ownerEmailFor(calendar);
  if (owner) {
    tasks.push(
      send({
        to: owner,
        subject: `Online booking ${kind === 'booked' ? 'new' : kind}: ${booking.caller_name || 'Customer'} — ${window}`,
        html: emailShell(
          `Online booking ${kind === 'booked' ? 'received' : kind}`,
          `<p>${escapeHtml(booking.caller_name || 'Customer')} · ${escapeHtml(booking.caller_phone || '')}${customerEmail ? ` · ${escapeHtml(customerEmail)}` : ''}</p><p><b>${escapeHtml(window)}</b></p>${
            booking.service_address ? `<p>Address: ${escapeHtml(booking.service_address)}</p>` : ''
          }${booking.issue ? `<p>Need: ${escapeHtml(booking.issue)}</p>` : ''}<p>See it in your <a href="${EXECUTIVE_RECEPTIONIST_ORIGIN}/desk">Desk</a>.</p>`,
        ),
      }).catch((e) => console.error('Owner booking email failed', e instanceof Error ? e.message : e)),
    );
  }
  await Promise.all(tasks);
}

export async function bookOnline(calendar: CalendarRow, input: PublicBookingInput, now = new Date()) {
  const all = await publicOpenSlots(calendar, now);
  const slot = all.find((s) => s.start === new Date(input.slotStart).toISOString());
  if (!slot) return { ok: false as const, error: 'That time was just taken. Pick another.' };
  const booking = await insertOnlineBooking({
    calendar_id: calendar.id,
    start_at: slot.start,
    end_at: slot.end,
    caller_name: input.name,
    caller_phone: input.phone,
    caller_email: input.email || null,
    service_address: input.address || null,
    issue: input.issue || null,
    conversation_id: null,
    is_demo: calendar.is_demo,
    sms_opt_in: false,
  });
  const inSlot = await bookingsInSlot(calendar.id, slot.start, slot.end);
  const ordered = [...inSlot].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  if (ordered.findIndex((b) => b.id === booking.id) >= calendar.slot_capacity) {
    await cancelBooking(booking.id);
    return { ok: false as const, error: 'That time was just taken. Pick another.' };
  }
  await runAfterBook(calendar, booking, slot.label, { businessName: businessNameForCalendar, record: updateBookingSync });
  await sendPublicBookingEmails('booked', calendar, booking, input.email);
  return { ok: true as const, bookingId: booking.id, window: slot.label, manageUrl: manageBookingUrl(booking.id) };
}

export async function rescheduleOnline(calendar: CalendarRow, booking: BookingRow, slotStart: string, now = new Date()) {
  if (booking.status !== 'booked' || booking.start_at < now.toISOString()) return { ok: false as const, error: 'This appointment can no longer be changed online.' };
  const all = await publicOpenSlots(calendar, now, defaultDeps, booking.id);
  const slot = all.find((s) => s.start === new Date(slotStart).toISOString());
  if (!slot) return { ok: false as const, error: 'That time is not open. Pick another.' };
  const moved = await moveBooking(booking.id, slot.start, slot.end);
  await sendPublicBookingEmails('moved', calendar, moved, String((booking as { caller_email?: string }).caller_email || ''));
  return { ok: true as const, window: slot.label };
}

export async function cancelOnline(calendar: CalendarRow, booking: BookingRow, now = new Date()) {
  if (booking.status !== 'booked' || booking.start_at < now.toISOString()) return { ok: false as const, error: 'This appointment can no longer be changed online.' };
  await cancelBooking(booking.id);
  await sendPublicBookingEmails('canceled', calendar, booking, String((booking as { caller_email?: string }).caller_email || ''));
  return { ok: true as const };
}
