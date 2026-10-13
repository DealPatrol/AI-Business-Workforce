/**
 * Live transfer via ElevenLabs' built-in transfer_to_number system tool.
 * Works on Twilio-native numbers imported into ElevenLabs. The transferred leg
 * is billed by Twilio at its normal outbound per-minute rate.
 */
export function transferToolConfig(number: string | null, rule: string | null) {
  if (!number) return null;
  const condition = (rule || 'The caller asks for a person, or the call is an emergency the owner wants to take live.').slice(0, 500);
  return {
    type: 'system',
    name: 'transfer_to_number',
    description: 'Transfer the caller to the business owner when the transfer rule applies.',
    params: {
      system_tool_type: 'transfer_to_number',
      transfers: [
        {
          transfer_destination: { type: 'phone', phone_number: number },
          phone_number: number,
          condition,
          transfer_type: 'conference',
        },
      ],
      enable_client_message: true,
    },
  };
}

export async function applyTransferToAgent(agentId: string, number: string | null, rule: string | null) {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: 'ELEVENLABS_API_KEY not configured' };
  const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}`, {
    method: 'PATCH',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_config: { agent: { prompt: { built_in_tools: { transfer_to_number: transferToolConfig(number, rule) } } } },
    }),
    cache: 'no-store',
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { ok: false, error: `ElevenLabs ${response.status}: ${text.slice(0, 300)}` };
  }
  return { ok: true };
}
