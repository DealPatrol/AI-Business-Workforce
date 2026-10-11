import { NextRequest, NextResponse } from 'next/server';
import { verifyElevenLabsSignature } from '@/lib/ava/elevenlabs-signature';
import { extractPostCallLead, savePostCallLead } from '@/lib/ava/post-call-lead';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function readHeader(req: NextRequest, name: string) {
  return req.headers.get(name) || req.headers.get(name.toLowerCase()) || '';
}

export async function POST(req: NextRequest) {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error('ELEVENLABS_WEBHOOK_SECRET is not set; rejecting ElevenLabs webhook.');
    return NextResponse.json(
      { error: 'ElevenLabs webhook secret is not configured.' },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = readHeader(req, 'elevenlabs-signature');
  if (!verifyElevenLabsSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid ElevenLabs signature.' }, { status: 401 });
  }

  let event: { type?: string };
  try {
    event = JSON.parse(rawBody) as { type?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (event.type !== 'post_call_transcription') {
    return NextResponse.json({ received: true, skipped: event.type || 'unknown' });
  }

  const lead = extractPostCallLead(event);
  if (!lead) {
    return NextResponse.json({ received: true, skipped: 'unreadable' });
  }

  try {
    // Unknown agent ids (public demo, Sales Ava, canceled shops) return
    // { skipped: true, reason: 'ignored_agent' } with no lead, email, or SMS.
    const result = await savePostCallLead(lead);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error('ElevenLabs post-call webhook failed', error);
    return NextResponse.json({ error: 'Webhook handling failed.' }, { status: 500 });
  }
}
