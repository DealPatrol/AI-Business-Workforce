/** Customer channel choices for Executive Receptionist. SMS is stored but not activated. */

export type AvaChannelFlags = {
  channelVoice: boolean;
  channelSms: boolean;
  channelWebChat: boolean;
};

export const DEFAULT_CHANNEL_FLAGS: AvaChannelFlags = {
  channelVoice: true,
  channelSms: false,
  channelWebChat: false,
};

/** HTML checkbox / JSON helpers. Unchecked boxes are absent from FormData. */
export function parseChannelFlag(value: unknown, defaultValue: boolean): boolean {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on', 'checked'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
}

export function parseChannelFlags(input: {
  channelVoice?: unknown;
  channelSms?: unknown;
  channelWebChat?: unknown;
}): AvaChannelFlags {
  return {
    channelVoice: parseChannelFlag(input.channelVoice, true),
    // SMS stays off by default; checkbox is informational until setup activates it.
    channelSms: parseChannelFlag(input.channelSms, false),
    channelWebChat: parseChannelFlag(input.channelWebChat, false),
  };
}

/** Copy-paste website chat embed for a customer agent. */
export function buildWebChatEmbedSnippet(agentId: string): string {
  const id = String(agentId || '').trim();
  if (!id) {
    return [
      '<!-- Your website chat widget will appear here once Cole attaches your agent ID. -->',
      '<elevenlabs-convai agent-id="YOUR_AGENT_ID"></elevenlabs-convai>',
      '<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>',
    ].join('\n');
  }
  return [
    `<elevenlabs-convai agent-id="${id}"></elevenlabs-convai>`,
    '<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>',
  ].join('\n');
}

export function channelSummaryLine(flags: AvaChannelFlags): string {
  const parts: string[] = [];
  if (flags.channelVoice) parts.push('Voice');
  if (flags.channelWebChat) parts.push('Website chat');
  if (flags.channelSms) parts.push('Texting (available after setup)');
  return parts.length ? parts.join(', ') : 'None selected';
}
