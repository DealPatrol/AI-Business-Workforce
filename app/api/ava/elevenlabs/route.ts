import { NextRequest, NextResponse } from 'next/server';
import { getAvaSignedUrl, type AvaElevenLabsMode } from '@/lib/ava/elevenlabs-signed-url';
import { DEFAULT_AVA_VOICE, isAvaVoiceKey } from '@/lib/ava/voice-options';

/**
 * GET /api/ava/elevenlabs
 * GET /api/ava/elevenlabs?voice=southern-woman
 * GET /api/ava/elevenlabs?mode=sales
 *
 * Default mode uses the selected demo voice agent, falling back to ELEVENLABS_AGENT_ID.
 * mode=sales uses ELEVENLABS_SALES_AGENT_ID (Workforce qualify funnel).
 */
export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get('mode') || 'demo').toLowerCase();
  const mode: AvaElevenLabsMode = raw === 'sales' ? 'sales' : 'demo';
  const requestedVoice = (req.nextUrl.searchParams.get('voice') || DEFAULT_AVA_VOICE).toLowerCase();

  if (mode === 'demo' && !isAvaVoiceKey(requestedVoice)) {
    return NextResponse.json({ error: 'Unknown Ava voice option.' }, { status: 400 });
  }

  const result = await getAvaSignedUrl(
    mode,
    isAvaVoiceKey(requestedVoice) ? requestedVoice : DEFAULT_AVA_VOICE,
  );
  return NextResponse.json(result.body, { status: result.status });
}
