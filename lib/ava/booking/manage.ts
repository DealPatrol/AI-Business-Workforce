/**
 * Reschedule and cancel by phone. The caller is matched to their booking by the number they give
 * (last 10 digits must equal the booking's callback number) on the calling agent's own calendar only.
 * No texts are sent from here; the owner's Google event is moved or removed when linked.
 */
import { outsideBusy } from '@/lib/ava/booking/after-book';
import { bookingWindowLabel } from '@/lib/ava/booking/event';
import { deleteGoogleEvent, isGoogleLinked, updateGoogleEvent, type GoogleEventInput } from '@/lib/ava/booking/google';
import { computeOpenSlots, pickSlotsToOffer, type BookedRange, type OpenSlot } from '@/lib/ava/booking/slots';
import {
  cancelBooking,
  getBooking,
  listBookings,
  moveBooking,
  phoneKey,
  settingsOf,
  upcomingBookingsForPhone,
  type BookingRow,
  type CalendarRow,
} from '@/lib/ava/booking/store';

export type ManageDeps = {
  upcoming: (calendarId: string, phone: string, nowIso: string) => Promise<BookingRow[]>;
  get: (id: string) => Promise<BookingRow | null>;
  list: (calendarId: string, fromIso: string, toIso: string) => Promise<BookedRange[]>;
  busy: (calendar: CalendarRow, fromIso: string, toIso: string) => Promise<BookedRange[]>;
  move: (id: string, startIso: string, endIso: string) => Promise<BookingRow>;
  cancel: (id: string) => Promise<void>;
  syncGoogle: (calendar: CalendarRow, booking: BookingRow, action: 'move' | 'delete') => Promise<void>;
};

function linkOf(calendar: CalendarRow) {
  return { id: calendar.id, google_refresh_token_enc: calendar.google_refresh_token_enc ?? null, google_calendar_id: calendar.google_calendar_id ?? null };
}

async function syncGoogleDefault(calendar: CalendarRow, booking: BookingRow, action: 'move' | 'delete') {
  if (calendar.is_demo || !isGoogleLinked(calendar) || !booking.google_event_id) return;
  try {
    if (action === 'delete') {
      await deleteGoogleEvent(linkOf(calendar), booking.google_event_id);
      return;
    }
    const input: GoogleEventInput = {
      bookingId: booking.id,
      startAt: booking.start_at,
      endAt: booking.end_at,
      timeZone: calendar.timezone || 'America/Chicago',
      callerName: booking.caller_name,
      callerPhone: booking.caller_phone,
      serviceAddress: booking.service_address,
      issue: booking.issue,
    };
    await updateGoogleEvent(linkOf(calendar), booking.google_event_id, input);
  } catch (error) {
    console.error('Google sync for changed booking failed', error instanceof Error ? error.message : error);
  }
}

export const defaultManageDeps: ManageDeps = {
  upcoming: upcomingBookingsForPhone,
  get: getBooking,
  list: (calendarId, fromIso, toIso) => listBookings(calendarId, fromIso, toIso),
  busy: (calendar, fromIso, toIso) => outsideBusy(calendar, fromIso, toIso),
  move: moveBooking,
  cancel: cancelBooking,
  syncGoogle: syncGoogleDefault,
};

function str(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function partOfDay(value: unknown): 'morning' | 'afternoon' | 'any' {
  const v = str(value, 20).toLowerCase();
  return v === 'morning' || v === 'afternoon' ? v : 'any';
}

function speak(booking: BookingRow, calendar: CalendarRow) {
  return { booking_id: booking.id, window: bookingWindowLabel(booking, calendar.timezone || 'America/Chicago') };
}

/** The caller's booking, only if it is on this calendar, still booked, upcoming, and matches the phone they gave. */
async function ownedBooking(calendar: CalendarRow, body: Record<string, unknown>, now: Date, deps: ManageDeps) {
  const id = str(body.booking_id, 80);
  const phone = str(body.caller_phone, 40);
  if (!id || !phoneKey(phone)) return null;
  const booking = await deps.get(id);
  if (!booking || booking.calendar_id !== calendar.id || booking.status !== 'booked') return null;
  if (booking.kind === 'callback') return null;
  if (phoneKey(booking.caller_phone) !== phoneKey(phone)) return null;
  if (booking.start_at < now.toISOString()) return null;
  return booking;
}

export async function handleFindBooking(calendar: CalendarRow, body: Record<string, unknown>, now = new Date(), deps: ManageDeps = defaultManageDeps) {
  const phone = str(body.caller_phone, 40);
  if (!phoneKey(phone)) {
    return { found: false, message: 'Ask for the phone number the appointment was booked under, with area code, then try again.' };
  }
  const rows = await deps.upcoming(calendar.id, phone, now.toISOString());
  if (!rows.length) {
    return {
      found: false,
      message: 'No upcoming appointment under that number. Double-check the number once; if still nothing, take their details and say the team will call back about it.',
    };
  }
  return {
    found: true,
    message: rows.length === 1 ? 'Confirm this is the appointment they mean.' : 'Read these back and ask which one they mean.',
    bookings: rows.slice(0, 3).map((row) => speak(row, calendar)),
  };
}

async function openSlots(calendar: CalendarRow, now: Date, deps: ManageDeps, ignoreId?: string): Promise<OpenSlot[]> {
  const settings = settingsOf(calendar);
  const fromIso = now.toISOString();
  const toIso = new Date(now.getTime() + (settings.horizonDays + 1) * 86_400_000).toISOString();
  const [booked, busy] = await Promise.all([deps.list(calendar.id, fromIso, toIso), deps.busy(calendar, fromIso, toIso)]);
  const others = booked.filter((b) => !('id' in b) || (b as BookingRow).id !== ignoreId);
  return computeOpenSlots(settings, others, now, busy);
}

export async function handleReschedule(calendar: CalendarRow, body: Record<string, unknown>, now = new Date(), deps: ManageDeps = defaultManageDeps) {
  const booking = await ownedBooking(calendar, body, now, deps);
  if (!booking) {
    return { rescheduled: false, message: 'Could not match that appointment to this caller. Use find_booking with their number first.' };
  }
  const all = await openSlots(calendar, now, deps, booking.id);
  const slotStart = str(body.new_slot_start, 40);
  if (!slotStart) {
    const offer = pickSlotsToOffer(all, { date: str(body.preferred_date, 10), partOfDay: partOfDay(body.part_of_day) });
    if (!offer.length) return { rescheduled: false, message: 'No open windows to move to. Keep the current time and say the team will call to find another.', slots: [] };
    return {
      rescheduled: false,
      message: 'Offer two of these windows. When they pick one, call reschedule_appointment again with new_slot_start copied exactly.',
      slots: offer.map((s) => ({ slot_start: s.start, say: s.label })),
    };
  }
  const slot = all.find((s) => s.start === new Date(slotStart).toISOString());
  if (!slot) {
    return {
      rescheduled: false,
      message: 'That window is not open. Offer these instead.',
      slots: pickSlotsToOffer(all, { date: slotStart.slice(0, 10) }).map((s) => ({ slot_start: s.start, say: s.label })),
    };
  }
  const moved = await deps.move(booking.id, slot.start, slot.end);
  await deps.syncGoogle(calendar, moved, 'move');
  return {
    rescheduled: true,
    ...speak(moved, calendar),
    message: calendar.is_demo
      ? `Moved on the demo calendar to ${slot.label}. Read it back and say this is a demo.`
      : `Moved to ${slot.label}. Read the new window back and say the team will confirm before the visit.`,
  };
}

export async function handleCancel(calendar: CalendarRow, body: Record<string, unknown>, now = new Date(), deps: ManageDeps = defaultManageDeps) {
  const booking = await ownedBooking(calendar, body, now, deps);
  if (!booking) {
    return { canceled: false, message: 'Could not match that appointment to this caller. Use find_booking with their number first.' };
  }
  await deps.cancel(booking.id);
  await deps.syncGoogle(calendar, booking, 'delete');
  return {
    canceled: true,
    ...speak(booking, calendar),
    message: 'Canceled. Read back which appointment was canceled and ask if they want to book a different time.',
  };
}
