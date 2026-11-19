import { NextRequest, NextResponse } from 'next/server';
import { missingConversations, type ListedConversation } from '@/lib/ava/lead-safety';
import { extractPostCallLead, savePostCallLead } from '@/lib/ava/post-call-lead';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const ELEVEN_API = 'https://api.elevenlabs.io/v1';
const LOOKBACK_SECS = 6 * 3600;
const MAX_REPLAYS = 25;

function authOk(req: NextRequest) {
  const secret = (process.env.CRON_SECRET || process.env.AVA_BILLING_CRON_SECRET)?.trim();
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

async function eleven(path: string, apiKey: string) {
  const r = await fetch(`${ELEVEN_API}${path}`, { headers: { 'xi-api-key': apiKey }, cache: 'no-store' });
  if (!r.ok) throw new Error(`ElevenLabs returned ${r.status}`);
  return (await r.json()) as Record<string, unknown>;
}

/**
 * Hourly safety net for the post-call webhook: replays recent customer calls that never reached
 * ava_call_leads. savePostCallLead is idempotent, so a replay never double-emails.
 */
export async function GET(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: 'ELEVENLABS_API_KEY is not configured.' }, { status: 503 });

  const supabase = createAdminClient();
  const { data: onboardings, error } = await supabase.from('ava_onboardings').select('elevenlabs_agent_id').not('elevenlabs_agent_id', 'is', null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const agentIds = [...new Set((onboardings ?? []).map((o) => String(o.elevenlabs_agent_id || '')).filter(Boolean))];

  const nowSecs = Math.floor(Date.now() / 1000);
  const listed: ListedConversation[] = [];
  for (const agentId of agentIds) {
    try {
      const page = await eleven(
        `/convai/conversations?agent_id=${encodeURIComponent(agentId)}&call_start_after_unix=${nowSecs - LOOKBACK_SECS}&page_size=100`,
        apiKey,
      );
      for (const c of (page.conversations as ListedConversation[] | undefined) ?? []) listed.push({ ...c, agent_id: agentId });
    } catch (e) {
      console.error('Reconcile: listing conversations failed for an agent', e instanceof Error ? e.message : e);
    }
  }
  if (listed.length === 0) return NextResponse.json({ ok: true, checked: 0, replayed: 0 });

  const ids = listed.map((c) => c.conversation_id);
  const { data: saved, error: savedError } = await supabase.from('ava_call_leads').select('conversation_id').in('conversation_id', ids);
  if (savedError) return NextResponse.json({ error: savedError.message }, { status: 500 });
  const savedIds = new Set((saved ?? []).map((r) => String(r.conversation_id)));
  const missing = missingConversations(listed, savedIds, nowSecs).slice(0, MAX_REPLAYS);

  let replayed = 0;
  const failures: string[] = [];
  for (const c of missing) {
    try {
      const conversation = await eleven(`/convai/conversations/${encodeURIComponent(c.conversation_id)}`, apiKey);
      const lead = extractPostCallLead({ type: 'post_call_transcription', data: conversation });
      if (!lead) continue;
      const result = await savePostCallLead(lead);
      if (!result.skipped) replayed += 1;
    } catch (e) {
      failures.push(c.conversation_id);
      console.error('Reconcile: replay failed', c.conversation_id, e instanceof Error ? e.message : e);
    }
  }
  return NextResponse.json({ ok: failures.length === 0, checked: listed.length, missing: missing.length, replayed, failures });
}
