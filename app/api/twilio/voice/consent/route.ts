import { NextRequest } from 'next/server';
import { handleConsentAnswer, missedCallEnvFromProcess } from '@/lib/twilio/missed-call';
import { readTwilioRequest, twimlResponse } from '@/lib/twilio/route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** <Gather action>: record the caller's yes/no, then text only on a recorded yes. */
export async function POST(req: NextRequest) {
  const twilioReq = await readTwilioRequest(req);
  const result = await handleConsentAnswer(twilioReq, missedCallEnvFromProcess());
  return twimlResponse(result);
}
