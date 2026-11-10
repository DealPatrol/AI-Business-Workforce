import { NextRequest, NextResponse } from 'next/server';
import { authorizeToolCall } from '@/lib/ava/booking/route-helpers';
import { handleBook } from '@/lib/ava/booking/tool-handlers';

export const dynamic = 'force-dynamic';

/** ElevenLabs webhook tool: books one open window on the calling agent's calendar. */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeToolCall(request);
    if (!auth.ok) return auth.response;
    return NextResponse.json(await handleBook(auth.calendar, auth.body));
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
