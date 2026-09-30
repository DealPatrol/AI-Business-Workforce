import { AvaVoiceKey, DEFAULT_AVA_VOICE } from '@/lib/ava/voice-options';

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';

export type AvaElevenLabsMode = 'demo' | 'sales';

function getDemoAgentId(voice: AvaVoiceKey) {
  const fallbackAgentId = process.env.ELEVENLABS_AGENT_ID;
  const voiceAgentIds: Record<AvaVoiceKey, string | undefined> = {
    'southern-man': process.env.ELEVENLABS_AGENT_ID_SOUTHERN_MAN,
    'southern-woman': process.env.ELEVENLABS_AGENT_ID_SOUTHERN_WOMAN,
    'american-woman': process.env.ELEVENLABS_AGENT_ID_AMERICAN_WOMAN,
  };

  return voiceAgentIds[voice] || fallbackAgentId;
}

export async function getAvaSignedUrl(
  mode: AvaElevenLabsMode = 'demo',
  voice: AvaVoiceKey = DEFAULT_AVA_VOICE,
) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return {
      status: 500 as const,
      body: { error: 'ELEVENLABS_API_KEY is not configured' },
    };
  }

  const isSales = mode === 'sales';
  const agentId = isSales
    ? process.env.ELEVENLABS_SALES_AGENT_ID
    : getDemoAgentId(voice);

  if (!agentId) {
    return {
      status: 200 as const,
      body: {
        configured: false,
        mode: isSales ? 'sales' : 'demo',
        next: isSales
          ? 'Create a separate Sales Ava ElevenLabs agent and add ELEVENLABS_SALES_AGENT_ID to Vercel.'
          : 'Create an ElevenLabs Agent for Ava and add ELEVENLABS_AGENT_ID to Vercel.',
      },
    };
  }

  try {
    const params = new URLSearchParams({ agent_id: agentId, include_conversation_id: 'true' });
    const response = await fetch(`${ELEVENLABS_API}/convai/conversation/get-signed-url?${params}`, {
      headers: { 'xi-api-key': apiKey },
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        status: response.status,
        body: { error: 'ElevenLabs rejected the request', details: data },
      };
    }
    return {
      status: 200 as const,
      body: {
        configured: true,
        mode: isSales ? 'sales' : 'demo',
        ...(isSales ? {} : { voice }),
        signedUrl: data.signed_url,
        conversationId: data.conversation_id || null,
      },
    };
  } catch (error) {
    return {
      status: 502 as const,
      body: {
        error: 'Unable to connect to ElevenLabs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
