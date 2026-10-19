import { NextRequest } from 'next/server';
import { handleIncomingSms, missedCallEnvFromProcess } from '@/lib/twilio/missed-call';
import { readTwilioRequest, twimlResponse } from '@/lib/twilio/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Twilio "A message comes in" webhook: forward the caller's reply to the owner. */
export async function POST(req: NextRequest) {
  const twilioReq = await readTwilioRequest(req);
  const result = await handleIncomingSms(twilioReq, missedCallEnvFromProcess());
  return twimlResponse(result);
}
