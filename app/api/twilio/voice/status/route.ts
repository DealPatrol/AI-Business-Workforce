import { NextRequest } from 'next/server';
import { handleVoiceStatus, missedCallEnvFromProcess } from '@/lib/twilio/missed-call';
import { readTwilioRequest, twimlResponse } from '@/lib/twilio/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** <Dial action> callback: on no-answer/busy/failed, text the caller back and alert the owner. */
export async function POST(req: NextRequest) {
  const twilioReq = await readTwilioRequest(req);
  const result = await handleVoiceStatus(twilioReq, missedCallEnvFromProcess());
  return twimlResponse(result);
}
