import { NextRequest, NextResponse } from 'next/server';
import { bookingCalendarEvent } from '@/lib/ava/booking/event';
import { buildIcs, verifyBookingLinkToken } from '@/lib/ava/booking/ics';
import { getBooking, getCalendar } from '@/lib/ava/booking/store';
import { UUID_PATTERN } from '@/lib/leads/types';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

/** .ics download linked from the owner's lead email. The signed token stands in for a login. */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get('t') || '';
  if (!UUID_PATTERN.test(id) || !verifyBookingLinkToken(id, token)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  const booking = await getBooking(id).catch(() => null);
  if (!booking || booking.status !== 'booked') return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const calendar = await getCalendar(booking.calendar_id).catch(() => null);
  const ics = buildIcs(bookingCalendarEvent(booking, calendar?.label || 'Ava booking'));
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="ava-booking-${id.slice(0, 8)}.ics"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
