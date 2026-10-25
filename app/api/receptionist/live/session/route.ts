import { NextResponse } from 'next/server';
import { liveAgentId } from '@/lib/live-receptionist/config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/receptionist/live/session
 *
 * Returns a short-lived ElevenLabs signed URL when ELEVENLABS_API_KEY is configured.
 * Without a key it returns the public agent id so the browser can connect directly
 * (works only while the agent has authentication disabled). The key is never returned.
 */
export async function GET() {
  const agentId = liveAgentId();
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ mode: 'public', agentId }, { headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const params = new URLSearchParams({ agent_id: agentId });
    const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?${params}`, {
      headers: { 'xi-api-key': apiKey },
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as { signed_url?: string };
    if (!res.ok || !data.signed_url) {
      // Fall back to a public connection rather than failing the visitor.
      return NextResponse.json(
        { mode: 'public', agentId, warning: `signed-url request failed (${res.status})` },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return NextResponse.json(
      { mode: 'signed', signedUrl: data.signed_url },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ mode: 'public', agentId }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
