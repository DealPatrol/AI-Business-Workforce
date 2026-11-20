import { NextRequest, NextResponse } from 'next/server';
import { authorizeToolCall } from '@/lib/ava/booking/route-helpers';
import { handleCancel } from '@/lib/ava/booking/manage';

export const dynamic = 'force-dynamic';

/** ElevenLabs webhook tool on the calling agent's own calendar (see lib/ava/booking/manage.ts). */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeToolCall(request);
    if (!auth.ok) return auth.response;
    return NextResponse.json(await handleCancel(auth.calendar, auth.body));
  } catch (error) {
    console.error('Ava cancel-booking failed', error);
    return NextResponse.json({ canceled: false, message: 'The calendar is not reachable. Take the details and say the team will call to confirm the cancellation.' }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
