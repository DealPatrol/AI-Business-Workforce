import { NextRequest, NextResponse } from 'next/server';
import { authorizeToolCall } from '@/lib/ava/booking/route-helpers';
import { handleFindBooking } from '@/lib/ava/booking/manage';

export const dynamic = 'force-dynamic';

/** ElevenLabs webhook tool on the calling agent's own calendar (see lib/ava/booking/manage.ts). */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeToolCall(request);
    if (!auth.ok) return auth.response;
    return NextResponse.json(await handleFindBooking(auth.calendar, auth.body));
  } catch (error) {
    console.error('Ava find-booking failed', error);
    return NextResponse.json({ found: false, message: 'Look-up failed. Take their number and say the team will call back about the appointment.' }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
