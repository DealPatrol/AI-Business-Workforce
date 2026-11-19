import { NextRequest, NextResponse } from 'next/server';
import { avaOwnerEmail } from '@/lib/ava/mail';
import { authorizeToolCall } from '@/lib/ava/booking/route-helpers';
import { capabilityContext, createPendingTransfer } from '@/lib/ava/capabilities/store';
import { briefingSentence, toUsE164 } from '@/lib/ava/capabilities/transfer';

export const dynamic = 'force-dynamic';

function str(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/**
 * ElevenLabs webhook tool `prepare_transfer` (screened transfers only). Saves who to ring and the briefing,
 * keyed by the caller's own number, so the screening line can whisper it and ask for "press 1".
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeToolCall(request);
    if (!auth.ok) return auth.response;
    const b = auth.body;
    const callerId = toUsE164(b.caller_id) || toUsE164(b.caller_phone);
    if (auth.calendar.is_demo) {
      return NextResponse.json({ ok: false, message: 'Demo line: do not transfer. Say that on a real line you would connect them now, then take their details.' });
    }
    const ctx = await capabilityContext(auth.calendar, avaOwnerEmail());
    const urgent = b.urgent === true || str(b.urgent, 5).toLowerCase() === 'true';
    // Emergencies ring the emergency number first; everything else rings the office/person numbers first.
    const ordered = [...ctx.transferRules].sort((a, z) =>
      urgent ? Number(z.reason === 'emergency') - Number(a.reason === 'emergency') : Number(a.reason === 'emergency') - Number(z.reason === 'emergency'),
    );
    const numbers = ordered.map((r) => r.phone);
    if (!callerId || numbers.length === 0) {
      return NextResponse.json({ ok: false, message: 'Transfer is not available on this call. Offer a callback instead.' });
    }
    const brief = briefingSentence({
      businessName: ctx.businessName,
      callerName: str(b.caller_name, 120),
      callerPhone: str(b.caller_phone, 40),
      address: str(b.address, 300),
      issue: str(b.issue, 300),
      urgent,
    });
    await createPendingTransfer({
      calendarId: auth.calendar.id,
      conversationId: str(b.conversation_id, 120),
      callerId,
      numbers,
      brief,
      urgent,
      callerName: str(b.caller_name, 120),
      callerPhone: str(b.caller_phone, 40),
      address: str(b.address, 300),
      issue: str(b.issue, 300),
    });
    return NextResponse.json({ ok: true, message: 'Ready. Call transfer_to_number now.' });
  } catch (error) {
    console.error('Ava transfer prepare failed', error);
    return NextResponse.json({ ok: false, message: 'Transfer is not available right now. Offer a callback instead.' }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
