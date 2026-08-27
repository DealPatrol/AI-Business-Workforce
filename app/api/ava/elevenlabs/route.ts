import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';

export async function GET(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ELEVENLABS_API_KEY is not configured' }, { status: 500 });

  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) return NextResponse.json({ configured: false, next: 'Create an ElevenLabs Agent for Ava and add ELEVENLABS_AGENT_ID to Vercel.' });

  try {
    const params = new URLSearchParams({ agent_id: agentId, include_conversation_id: 'true' });
    const response = await fetch(`${ELEVENLABS_API}/convai/conversation/get-signed-url?${params}`, {
      headers: { 'xi-api-key': apiKey }, cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: 'ElevenLabs rejected the request', details: data }, { status: response.status });
    return NextResponse.json({ configured: true, signedUrl: data.signed_url, conversationId: data.conversation_id || null });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to connect to ElevenLabs', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 502 });
  }
}
