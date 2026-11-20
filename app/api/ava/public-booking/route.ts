import { NextRequest, NextResponse } from 'next/server';
import { clientIp } from '@/lib/analytics/request-context';
import { verifyBookingLinkToken } from '@/lib/ava/booking/ics';
import {
  bookOnline,
  cancelOnline,
  cleanPublicBookingInput,
  rescheduleOnline,
  verifyCalendarPublicToken,
} from '@/lib/ava/booking/public-booking';
import { getBooking, getCalendar } from '@/lib/ava/booking/store';
import { UUID_PATTERN } from '@/lib/leads/types';
import { createRateLimiter } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const take = createRateLimiter(10, 10 * 60_000);

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Hosted booking page actions. Signed links stand in for a login. */
export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers.get('x-forwarded-for')) || 'unknown';
  if (!take(ip).ok) return fail('Too many tries. Wait a few minutes.', 429);
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const action = String(body.action || '');
  const token = String(body.t || '');
  try {
    if (action === 'book') {
      const calendarId = String(body.calendar_id || '');
      if (!UUID_PATTERN.test(calendarId) || !verifyCalendarPublicToken(calendarId, token)) return fail('This booking link is not valid.', 404);
      const calendar = await getCalendar(calendarId);
      if (!calendar || !calendar.enabled) return fail('Online booking is off for this business.', 404);
      const input = cleanPublicBookingInput(body);
      if ('error' in input) return fail(input.error);
      const result = await bookOnline(calendar, input);
      return result.ok ? NextResponse.json(result) : fail(result.error, 409);
    }
    if (action === 'reschedule' || action === 'cancel') {
      const bookingId = String(body.booking_id || '');
      if (!UUID_PATTERN.test(bookingId) || !verifyBookingLinkToken(bookingId, token)) return fail('This link is not valid.', 404);
      const booking = await getBooking(bookingId);
      const calendar = booking ? await getCalendar(booking.calendar_id) : null;
      if (!booking || !calendar) return fail('Appointment not found.', 404);
      const result =
        action === 'cancel'
          ? await cancelOnline(calendar, booking)
          : await rescheduleOnline(calendar, booking, String(body.slot_start || ''));
      return result.ok ? NextResponse.json(result) : fail(result.error, 409);
    }
    return fail('Unknown action.');
  } catch (error) {
    console.error('Public booking failed', error instanceof Error ? error.message : error);
    return fail('Something went wrong. Call the business to book.', 500);
  }
}
