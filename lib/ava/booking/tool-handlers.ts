import { computeOpenSlots, pickSlotsToOffer, type OpenSlot } from '@/lib/ava/booking/slots';
import {
  bookingForConversation,
  bookingsInSlot,
  cancelBooking,
  insertBooking,
  listBookings,
  settingsOf,
  type CalendarRow,
} from '@/lib/ava/booking/store';

function str(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function partOfDay(value: unknown): 'morning' | 'afternoon' | 'any' {
  const v = str(value, 20).toLowerCase();
  return v === 'morning' || v === 'afternoon' ? v : 'any';
}

async function openSlots(calendar: CalendarRow, now: Date) {
  const settings = settingsOf(calendar);
  const horizonEnd = new Date(now.getTime() + (settings.horizonDays + 1) * 86_400_000).toISOString();
  const booked = await listBookings(calendar.id, now.toISOString(), horizonEnd);
  return computeOpenSlots(settings, booked, now);
}

function speakable(slots: OpenSlot[]) {
  return slots.map((s) => ({ slot_start: s.start, say: s.label }));
}

export async function handleAvailability(calendar: CalendarRow, body: Record<string, unknown>, now = new Date()) {
  const all = await openSlots(calendar, now);
  const offer = pickSlotsToOffer(all, { date: str(body.preferred_date, 10), partOfDay: partOfDay(body.part_of_day) });
  if (!offer.length) {
    return {
      available: false,
      message: 'No open windows in the booking calendar right now. Take the details and say the team will call to schedule.',
      slots: [],
    };
  }
  return {
    available: true,
    timezone: calendar.timezone,
    message: 'Offer two of these windows in plain words. Pass the chosen slot_start to book_appointment exactly as given.',
    slots: speakable(offer),
  };
}

export async function handleBook(calendar: CalendarRow, body: Record<string, unknown>, now = new Date()) {
  const slotStart = str(body.slot_start, 40);
  const conversationId = str(body.conversation_id, 120);
  const callerName = str(body.caller_name, 120);
  const callerPhone = str(body.caller_phone, 40);
  if (!slotStart || !callerName || !callerPhone) {
    return { booked: false, message: 'Missing slot_start, caller_name or caller_phone. Ask for what is missing, then try again.' };
  }

  if (conversationId) {
    const existing = await bookingForConversation(conversationId);
    if (existing && existing.calendar_id === calendar.id) {
      return { booked: true, already_booked: true, booking_id: existing.id, message: 'This caller is already booked on this call. Confirm that window; do not book again.' };
    }
  }

  const all = await openSlots(calendar, now);
  const slot = all.find((s) => s.start === new Date(slotStart).toISOString());
  if (!slot) {
    return {
      booked: false,
      message: 'That window is no longer open. Offer these instead.',
      slots: speakable(pickSlotsToOffer(all, { date: slotStart.slice(0, 10) })),
    };
  }

  const booking = await insertBooking({
    calendar_id: calendar.id,
    start_at: slot.start,
    end_at: slot.end,
    caller_name: callerName,
    caller_phone: callerPhone,
    service_address: str(body.service_address, 300) || null,
    issue: str(body.issue, 500) || null,
    conversation_id: conversationId || null,
    is_demo: calendar.is_demo,
  });

  // Two callers can race for the last spot; whoever saved later gives it back.
  const inSlot = await bookingsInSlot(calendar.id, slot.start, slot.end);
  const ordered = [...inSlot].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  if (ordered.findIndex((b) => b.id === booking.id) >= calendar.slot_capacity) {
    await cancelBooking(booking.id);
    return { booked: false, message: 'Someone just took that window. Offer another one.', slots: speakable(pickSlotsToOffer(all.filter((s) => s.start !== slot.start), {})) };
  }

  return {
    booked: true,
    booking_id: booking.id,
    window: slot.label,
    message: calendar.is_demo
      ? `Booked on the demo calendar for ${slot.label}. Read the window back and say this is a demo, so no one will actually come out.`
      : `Booked for ${slot.label}. Read the window back, and say the team will confirm before the visit.`,
  };
}
