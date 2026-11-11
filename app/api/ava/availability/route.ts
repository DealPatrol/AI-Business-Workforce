import { NextRequest, NextResponse } from 'next/server';
import { authorizeToolCall } from '@/lib/ava/booking/route-helpers';
import { handleAvailability } from '@/lib/ava/booking/tool-handlers';

export const dynamic = 'force-dynamic';

/** ElevenLabs webhook tool: open booking windows for the calling agent's calendar. */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeToolCall(request);
    if (!auth.ok) return auth.response;
    return NextResponse.json(await handleAvailability(auth.calendar, auth.body));
  } catch (error) {
    console.error('Ava availability failed', error);
    return NextResponse.json(
      { available: false, message: 'The calendar is not reachable. Take the details and say the team will call to schedule.' },
      { status: 200 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
