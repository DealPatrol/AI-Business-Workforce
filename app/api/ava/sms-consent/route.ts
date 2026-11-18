import { NextRequest, NextResponse } from 'next/server';
import { twilioTransport } from '@/lib/ava/booking/sms-confirm';
import { createRateLimiter } from '@/lib/rate-limit';
import {
  CONSENT_TOOL_SECRET_HEADER,
  consentSecretMatches,
  findOnboardingForAgent,
  handleConsentTool,
  type ConsentToolEnv,
} from '@/lib/sms/ava-consent-tool';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const take = createRateLimiter(120, 60_000);

/** ElevenLabs webhook tool `record_sms_consent`: writes the caller's verbal yes/no to sms_consents. */
export async function POST(request: NextRequest) {
  const env = process.env as ConsentToolEnv;
  if (!take(request.headers.get('x-forwarded-for') || 'consent').ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  if (!consentSecretMatches(request.headers.get(CONSENT_TOOL_SECRET_HEADER) || '', env)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  const raw = await request.json().catch(() => null);
  const body = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  try {
    const result = await handleConsentTool(body, env, {
      findAgent: findOnboardingForAgent,
      sendText: twilioTransport(env),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('record_sms_consent failed', error);
    return NextResponse.json({
      recorded: false,
      answer: null,
      say: '',
      message: "Recording failed. Do not send or promise any text on this call. Say: \"No problem, I'll make a note.\" and continue.",
    });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
