import { parseIngestPayload } from '@/lib/leads/parse';
import { findLeadByConversationId, insertLead, resolveClientIdFromAgent } from '@/lib/leads/store';
import type { ErLead } from '@/lib/leads/types';

export async function ingestLead(raw: unknown): Promise<
  { ok: true; lead: ErLead; duplicate: boolean } | { ok: false; error: string; status: number }
> {
  const parsed = parseIngestPayload(raw);
  if (!parsed.ok) return { ok: false, error: parsed.error, status: 400 };

  const input = parsed.value;
  if (!input.clientId && input.agentId) {
    const resolved = await resolveClientIdFromAgent(input.agentId);
    if (resolved.clientId) input.clientId = resolved.clientId;
  }

  if (input.conversationId) {
    const existing = await findLeadByConversationId(input.conversationId);
    if (existing) return { ok: true, lead: existing, duplicate: true };
  }

  try {
    const lead = await insertLead(input);
    return { ok: true, lead, duplicate: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (input.conversationId && /duplicate|unique/i.test(message)) {
      const existing = await findLeadByConversationId(input.conversationId);
      if (existing) return { ok: true, lead: existing, duplicate: true };
    }
    throw error;
  }
}
