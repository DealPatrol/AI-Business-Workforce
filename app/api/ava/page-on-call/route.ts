import { NextRequest, NextResponse } from 'next/server';
import { authorizeToolCall } from '@/lib/ava/booking/route-helpers';
import { pageToolMessage } from '@/lib/ava/capabilities/paging';
import { pageOnCall } from '@/lib/ava/capabilities/server';

export const dynamic = 'force-dynamic';

function str(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** ElevenLabs webhook tool `page_on_call`: emails (and, when approved, texts) the on-call list. */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeToolCall(request);
    if (!auth.ok) return auth.response;
    const b = auth.body;
    const reason = ['transfer_unanswered', 'no_transfer', 'after_hours'].includes(str(b.reason, 30))
      ? (str(b.reason, 30) as 'transfer_unanswered' | 'no_transfer' | 'after_hours')
      : 'no_transfer';
    const result = await pageOnCall(auth.calendar, {
      callerName: str(b.caller_name, 120),
      callerPhone: str(b.caller_phone, 40),
      address: str(b.address, 300),
      issue: str(b.issue, 300),
      reason,
      conversationId: str(b.conversation_id, 120),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Ava on-call page failed', error);
    const r = { paged: false, delivered: { email: 0, sms: 0 }, failed: 1 };
    return NextResponse.json({ ...r, message: pageToolMessage(r) }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
