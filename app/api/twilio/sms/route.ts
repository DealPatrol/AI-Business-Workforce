import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toE164 } from '@/lib/analytics/contact';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function validTwilioSignature(url: string, params: URLSearchParams, signature: string, token: string) {
  const data = url + [...params.keys()].sort().map((key) => key + (params.get(key) ?? '')).join('');
  const expected = createHmac('sha1', token).update(data).digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Inbound SMS webhook (set as the Twilio number's "A message comes in" URL). Records STOP/START. */
export async function POST(req: NextRequest) {
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const publicUrl = `${(process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/$/, '')}/api/twilio/sms`;
  if (!token || !validTwilioSignature(publicUrl, params, req.headers.get('x-twilio-signature') || '', token)) {
    return new NextResponse('forbidden', { status: 403 });
  }
  const from = toE164(params.get('From') || '');
  const body = (params.get('Body') || '').trim().toUpperCase();
  const admin = createAdminClient();
  if (from && /^(STOP|STOPALL|UNSUBSCRIBE|CANCEL|END|QUIT)$/.test(body)) {
    await admin.from('sms_opt_outs').upsert({ phone: from });
  } else if (from && /^(START|UNSTOP|YES)$/.test(body)) {
    await admin.from('sms_opt_outs').delete().eq('phone', from);
  }
  // Twilio's own Advanced Opt-Out sends the confirmation text; reply empty here.
  return new NextResponse('<Response/>', { headers: { 'Content-Type': 'text/xml' } });
}
