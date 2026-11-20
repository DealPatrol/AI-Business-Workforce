import { NextRequest, NextResponse } from 'next/server';
import { authorizeToolCall } from '@/lib/ava/booking/route-helpers';
import { handleReschedule } from '@/lib/ava/booking/manage';

export const dynamic = 'force-dynamic';

/** ElevenLabs webhook tool on the calling agent's own calendar (see lib/ava/booking/manage.ts). */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeToolCall(request);
    if (!auth.ok) return auth.response;
    return NextResponse.json(await handleReschedule(auth.calendar, auth.body));
  } catch (error) {
    console.error('Ava reschedule failed', error);
    return NextResponse.json({ rescheduled: false, message: 'The calendar is not reachable. Keep the current time and say the team will call to move it.' }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
