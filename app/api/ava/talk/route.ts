import { NextRequest, NextResponse } from 'next/server';
import { clientIp } from '@/lib/analytics/request-context';
import { takeTalkSession, talkAgentId } from '@/lib/ava/talk-to-ava';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * GET /api/ava/talk
 * Mints a short-lived ElevenLabs signed URL for the public "Talk to Ava" web demo agent.
 * The API key never leaves the server. Rate limited per visitor; the agent itself is capped in ElevenLabs.
 */
export async function GET(req: NextRequest) {
  const ip = clientIp(req.headers.get('x-forwarded-for')) || 'unknown';
  const limit = takeTalkSession(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'not_configured' }, { status: 503, headers: NO_STORE });

  try {
    const params = new URLSearchParams({ agent_id: talkAgentId() });
    const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?${params}`, {
      headers: { 'xi-api-key': apiKey },
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as { signed_url?: string };
    if (!res.ok || !data.signed_url) {
      return NextResponse.json({ error: 'unavailable' }, { status: 502, headers: NO_STORE });
    }
    return NextResponse.json({ signedUrl: data.signed_url }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 502, headers: NO_STORE });
  }
}
