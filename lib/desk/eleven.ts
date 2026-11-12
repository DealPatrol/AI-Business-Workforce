/** Server-only ElevenLabs helpers for the Desk. The API key never leaves the server. */
const API = 'https://api.elevenlabs.io/v1';
const CONVERSATION_ID = /^conv_[A-Za-z0-9]{6,120}$/;

function key() {
  return process.env.ELEVENLABS_API_KEY?.trim() || '';
}

async function call(path: string, init: RequestInit = {}) {
  const apiKey = key();
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not configured.');
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(`ElevenLabs returned ${res.status}.`);
  return data;
}

/** The agent's current first message, or '' if it cannot be read. */
export async function readAgentGreeting(agentId: string) {
  if (!key()) return '';
  try {
    const agent = await call(`/convai/agents/${encodeURIComponent(agentId)}`);
    const cfg = (agent.conversation_config as Record<string, unknown> | undefined)?.agent as Record<string, unknown> | undefined;
    return typeof cfg?.first_message === 'string' ? cfg.first_message : '';
  } catch {
    return '';
  }
}

export async function saveAgentGreeting(agentId: string, greeting: string) {
  await call(`/convai/agents/${encodeURIComponent(agentId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ conversation_config: { agent: { first_message: greeting } } }),
  });
}

/** Replaces only the prompt text; attached tools are untouched. */
export async function saveAgentPrompt(agentId: string, prompt: string) {
  const agent = await call(`/convai/agents/${encodeURIComponent(agentId)}`);
  const current = ((agent.conversation_config as Record<string, unknown>)?.agent as Record<string, unknown>)?.prompt as
    | Record<string, unknown>
    | undefined;
  const toolIds = Array.isArray(current?.tool_ids) ? current!.tool_ids : undefined;
  await call(`/convai/agents/${encodeURIComponent(agentId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ conversation_config: { agent: { prompt: { prompt, ...(toolIds ? { tool_ids: toolIds } : {}) } } } }),
  });
}

/** Call lengths in seconds for conversations missing one. Bounded; never throws. */
export async function conversationDurations(conversationIds: string[], limit = 25) {
  const out = new Map<string, number>();
  if (!key()) return out;
  const ids = [...new Set(conversationIds.filter((id) => CONVERSATION_ID.test(id)))].slice(0, limit);
  await Promise.all(
    ids.map(async (id) => {
      try {
        const data = await call(`/convai/conversations/${encodeURIComponent(id)}`);
        const secs = (data.metadata as Record<string, unknown> | undefined)?.call_duration_secs;
        if (typeof secs === 'number' && Number.isFinite(secs) && secs >= 0) out.set(id, Math.round(secs));
      } catch {
        // Missing or deleted conversation: leave it uncounted.
      }
    }),
  );
  return out;
}
