import { NextRequest, NextResponse, after } from 'next/server';
import { runAfterBook } from '@/lib/ava/booking/after-book';
import { authorizeToolCall } from '@/lib/ava/booking/route-helpers';
import { businessNameForCalendar, updateBookingSync } from '@/lib/ava/booking/store';
import { handleBook } from '@/lib/ava/booking/tool-handlers';

export const dynamic = 'force-dynamic';

/** ElevenLabs webhook tool: books one open window on the calling agent's calendar. */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeToolCall(request);
    if (!auth.ok) return auth.response;
    const result = await handleBook(auth.calendar, auth.body, new Date(), {
      // Text the caller and add the owner's Google event after Ava has her answer.
      afterBook: (calendar, booking, window) => {
        after(() => runAfterBook(calendar, booking, window, { businessName: businessNameForCalendar, record: updateBookingSync }));
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Ava booking failed', error);
    return NextResponse.json(
      { booked: false, message: 'The booking did not go through. Take the details and say the team will call to schedule.' },
      { status: 200 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
