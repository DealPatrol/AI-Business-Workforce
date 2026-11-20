import { NextRequest, NextResponse } from 'next/server';
import { handleScreenStep, type ScreenStep } from '@/lib/ava/capabilities/screen-server';
import { readTwilioRequest, twimlResponse } from '@/lib/twilio/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STEPS: ScreenStep[] = ['screen', 'whisper', 'accept', 'next'];

/**
 * Voicemail-safe transfer screen. Point a dedicated Twilio number's voice webhook at
 * /api/twilio/transfer/screen and set AVA_TRANSFER_SCREEN_NUMBER to it (needs Cole's OK; not live).
 */
export async function POST(req: NextRequest, context: { params: Promise<{ step: string }> }) {
  const { step } = await context.params;
  if (!STEPS.includes(step as ScreenStep)) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const twilioReq = await readTwilioRequest(req);
  const base = new URL(twilioReq.urls[twilioReq.urls.length - 1] || req.url).origin;
  const result = await handleScreenStep(
    step as ScreenStep,
    twilioReq,
    new URL(req.url).searchParams,
    base,
    process.env.TWILIO_AUTH_TOKEN?.trim() || '',
  );
  return twimlResponse(result);
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
