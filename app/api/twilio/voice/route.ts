import { NextRequest } from 'next/server';
import { handleIncomingVoice, missedCallEnvFromProcess, VOICE_STATUS_PATH } from '@/lib/twilio/missed-call';
import { publicUrl, readTwilioRequest, twimlResponse } from '@/lib/twilio/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Twilio "A call comes in" webhook: forward to the owner's phone for ~20s. */
export async function POST(req: NextRequest) {
  const twilioReq = await readTwilioRequest(req);
  return twimlResponse(
    handleIncomingVoice(twilioReq, missedCallEnvFromProcess(), publicUrl(twilioReq, VOICE_STATUS_PATH)),
  );
}
