import { NextRequest, NextResponse } from 'next/server';
import { parseTwilioForm, requestUrlCandidates, type TwilioRequest } from './missed-call';

export async function readTwilioRequest(req: NextRequest): Promise<TwilioRequest> {
  const rawBody = await req.text();
  return {
    urls: requestUrlCandidates(req.url, req.headers),
    signature: req.headers.get('x-twilio-signature') || '',
    params: parseTwilioForm(rawBody),
  };
}

export function twimlResponse(result: { status: number; body: string }) {
  return new NextResponse(result.body, {
    status: result.status,
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/** Absolute URL for a sibling route on the same public origin Twilio called. */
export function publicUrl(twilioReq: TwilioRequest, path: string) {
  const base = twilioReq.urls[twilioReq.urls.length - 1] || twilioReq.urls[0];
  return new URL(path, base).toString();
}
