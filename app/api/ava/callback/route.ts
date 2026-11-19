import { NextRequest, NextResponse, after } from 'next/server';
import { authorizeToolCall } from '@/lib/ava/booking/route-helpers';
import { handleCallback } from '@/lib/ava/capabilities/callback';
import { callbackDeps } from '@/lib/ava/capabilities/server';

export const dynamic = 'force-dynamic';

/** ElevenLabs webhook tool `book_callback`: offers and holds a real callback window. */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeToolCall(request);
    if (!auth.ok) return auth.response;
    const deps = callbackDeps((work) => after(work));
    return NextResponse.json(await handleCallback(auth.calendar, auth.body, new Date(), deps));
  } catch (error) {
    console.error('Ava callback hold failed', error);
    return NextResponse.json(
      { held: false, message: 'The callback could not be held. Take the details and say the team will call back as soon as they can. Do not name a time.' },
      { status: 200 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
