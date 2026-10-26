import { NextResponse } from 'next/server';
import { liveAgentId, simliFaceId } from '@/lib/live-receptionist/config';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

/** Short-lived ElevenLabs signed URL, or null without a key / on failure. The key is never returned. */
async function elevenSignedUrl(agentId: string): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;
  try {
    const params = new URLSearchParams({ agent_id: agentId });
    const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?${params}`, {
      headers: { 'xi-api-key': apiKey },
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as { signed_url?: string };
    return res.ok && data.signed_url ? data.signed_url : null;
  } catch {
    return null;
  }
}

/** Short-lived Simli session token for the stock face, or null when SIMLI_API_KEY is unset / on failure. */
async function simliSessionToken(): Promise<string | null> {
  const apiKey = process.env.SIMLI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.simli.ai/compose/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-simli-api-key': apiKey },
      body: JSON.stringify({ faceId: simliFaceId(), handleSilence: true, maxSessionLength: 600, maxIdleTime: 120 }),
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as { session_token?: string };
    return res.ok && data.session_token ? data.session_token : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/receptionist/live/session
 *
 * - `simliToken` is present when the photorealistic face is available (SIMLI_API_KEY set and the token
 *   minted). The browser then streams the ElevenLabs agent's audio into the Simli face.
 * - Otherwise the browser uses the animated fallback face.
 * Secrets never leave the server; only short-lived session credentials do.
 */
export async function GET() {
  const agentId = liveAgentId();
  const [signedUrl, simliToken] = await Promise.all([elevenSignedUrl(agentId), simliSessionToken()]);
  const base = signedUrl ? { mode: 'signed' as const, signedUrl } : { mode: 'public' as const, agentId };
  return NextResponse.json(simliToken ? { ...base, simliToken } : base, { headers: NO_STORE });
}
