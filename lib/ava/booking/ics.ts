import { createHmac, timingSafeEqual } from 'node:crypto';

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description: string;
  location?: string;
};

function icsStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** RFC 5545 single-event calendar file. */
export function buildIcs(event: CalendarEvent, now = new Date()) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Front Porch Growth//Ava booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@ava-booking`,
    `DTSTAMP:${icsStamp(now)}`,
    `DTSTART:${icsStamp(event.start)}`,
    `DTEND:${icsStamp(event.end)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(event.description)}`,
    ...(event.location ? [`LOCATION:${icsEscape(event.location)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
}

/** "Add to Google Calendar" template link. */
export function googleCalendarUrl(event: CalendarEvent) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${icsStamp(event.start)}/${icsStamp(event.end)}`,
    details: event.description,
  });
  if (event.location) params.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function linkKey() {
  const key = process.env.AVA_BOOKING_LINK_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  return key ? `ava-booking-ics:${key}` : '';
}

/** Unguessable token so the .ics link in the owner's email works without a login. */
export function bookingLinkToken(bookingId: string) {
  const key = linkKey();
  if (!key) return '';
  return createHmac('sha256', key).update(bookingId).digest('base64url').slice(0, 32);
}

export function verifyBookingLinkToken(bookingId: string, token: string) {
  const expected = bookingLinkToken(bookingId);
  if (!expected || typeof token !== 'string' || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
