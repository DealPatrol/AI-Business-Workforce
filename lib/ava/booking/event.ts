import type { CalendarEvent } from '@/lib/ava/booking/ics';
import { bookingLinkToken, googleCalendarUrl } from '@/lib/ava/booking/ics';
import type { BookingRow } from '@/lib/ava/booking/store';
import { localDateOf, slotLabel } from '@/lib/ava/booking/slots';
import { getSiteUrl } from '@/lib/site-url';

export function bookingCalendarEvent(booking: BookingRow, businessLabel: string): CalendarEvent {
  const who = booking.caller_name || 'Caller';
  const lines = [
    `Booked by Ava on the phone${booking.is_demo ? ' (demo calendar)' : ''}.`,
    `Caller: ${who}`,
    booking.caller_phone ? `Phone: ${booking.caller_phone}` : '',
    booking.issue ? `Issue: ${booking.issue}` : '',
    booking.service_address ? `Address: ${booking.service_address}` : '',
  ].filter(Boolean);
  return {
    id: booking.id,
    title: `${businessLabel}: ${who}${booking.issue ? ` — ${booking.issue.slice(0, 60)}` : ''}`,
    start: new Date(booking.start_at),
    end: new Date(booking.end_at),
    description: lines.join('\n'),
    location: booking.service_address || undefined,
  };
}

/** Links for the lead email. The .ics link is empty when no signing key is configured. */
export function bookingLinks(booking: BookingRow, businessLabel: string) {
  const event = bookingCalendarEvent(booking, businessLabel);
  const token = bookingLinkToken(booking.id);
  return {
    googleUrl: googleCalendarUrl(event),
    icsUrl: token ? `${getSiteUrl()}/api/ava/bookings/${booking.id}/ics?t=${token}` : '',
  };
}

/** "Tuesday, November 10, 8 to 10 AM" for a saved booking, in the calendar's time zone. */
export function bookingWindowLabel(booking: Pick<BookingRow, 'start_at' | 'end_at'>, timeZone: string) {
  const start = new Date(booking.start_at);
  const end = new Date(booking.end_at);
  const minutes = (d: Date) => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).formatToParts(d);
    return Number(parts.find((p) => p.type === 'hour')?.value) * 60 + Number(parts.find((p) => p.type === 'minute')?.value);
  };
  return slotLabel(localDateOf(start, timeZone).date, minutes(start), minutes(end) || 24 * 60);
}
