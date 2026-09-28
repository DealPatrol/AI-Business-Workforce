import { NextRequest, NextResponse } from 'next/server';
import { parseMetaServerEventName, sendMetaServerEvent } from '@/lib/analytics/meta-capi';
import { clientIp, readCookieId, readEventId, safePageUrl } from '@/lib/analytics/request-context';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const eventName = parseMetaServerEventName(body?.eventName);
  if (!eventName) {
    return NextResponse.json({ error: 'Unknown event.' }, { status: 400 });
  }

  const result = await sendMetaServerEvent({
    eventName,
    eventId: readEventId(body?.eventId),
    eventSourceUrl: safePageUrl(body?.pageUrl, request.nextUrl.origin),
    email: String(body?.email || ''),
    phone: String(body?.phone || ''),
    clientIp: clientIp(request.headers.get('x-forwarded-for')),
    userAgent: request.headers.get('user-agent') || '',
    fbp: readCookieId(body?.fbp),
    fbc: readCookieId(body?.fbc),
  });

  return NextResponse.json(result);
}
