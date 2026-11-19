/**
 * No lost leads. Three layers:
 * 1. The post-call webhook returns 500 on any failure, so ElevenLabs retries (retries must be ON in the
 *    workspace webhook settings), and saving is idempotent per conversation (no double emails).
 * 2. On a failure, the operator gets a "lead held for retry" email with the caller's details right away,
 *    so a lead is never only in a failed request.
 * 3. An hourly reconcile job lists recent ElevenLabs conversations for every customer agent and replays any
 *    that never reached ava_call_leads (for example when every retry failed).
 */
import type { ExtractedCallLead } from '@/lib/ava/post-call-lead';

export type ListedConversation = {
  conversation_id: string;
  agent_id: string;
  status?: string;
  start_time_unix_secs?: number;
  call_duration_secs?: number;
};

/** Conversations that finished at least `minAgeSecs` ago, ran long enough to matter, and are not saved. */
export function missingConversations(listed: ListedConversation[], savedIds: Set<string>, nowSecs: number, minAgeSecs = 600) {
  return listed.filter((c) => {
    if (!c.conversation_id || savedIds.has(c.conversation_id)) return false;
    if (c.status && c.status !== 'done') return false;
    const ended = (c.start_time_unix_secs ?? 0) + (c.call_duration_secs ?? 0);
    if (!ended || nowSecs - ended < minAgeSecs) return false;
    return (c.call_duration_secs ?? 0) >= 5;
  });
}

export function fallbackLeadSubject(lead: Pick<ExtractedCallLead, 'callerName' | 'callerPhone'>) {
  return `[Held for retry] Ava call lead${lead.callerName ? ` — ${lead.callerName}` : ''}${lead.callerPhone ? ` (${lead.callerPhone})` : ''}`;
}

export function fallbackLeadHtml(
  lead: Pick<ExtractedCallLead, 'agentId' | 'conversationId' | 'callerName' | 'callerPhone' | 'need' | 'address' | 'urgency' | 'summary'>,
  reason: string,
  escape: (s: string) => string,
) {
  const row = (k: string, v: string) => `<tr><td><b>${escape(k)}</b></td><td>${escape(v || 'Not provided')}</td></tr>`;
  return `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#17211b"><h1 style="font-size:20px">Ava lead held for retry</h1><p>The post-call webhook could not finish saving this call (${escape(reason.slice(0, 200))}). ElevenLabs will retry and the hourly reconcile job will replay it, so the owner email should still go out. Here are the details so nothing is lost.</p><table style="border-collapse:collapse;width:100%">${row('Caller', lead.callerName)}${row('Phone', lead.callerPhone)}${row('Need', lead.need)}${row('Address', lead.address)}${row('Urgency', lead.urgency)}${row('Agent', lead.agentId)}${row('Conversation', lead.conversationId)}</table><h2 style="font-size:16px">Summary</h2><p style="white-space:pre-wrap">${escape(lead.summary.slice(0, 3000))}</p></div>`;
}
