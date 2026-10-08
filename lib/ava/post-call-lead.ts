import { parseStaffContacts, toE164 } from '@/lib/analytics/contact';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatAvaLeadSmsBody, sendAvaLeadSms } from '@/lib/ava/sms';
import { avaOwnerEmail, escapeHtml, sendResendEmail } from '@/lib/ava/mail';

type TranscriptTurn = {
  role: string;
  message: string;
  timeInCallSecs: number | null;
};

export type ExtractedCallLead = {
  conversationId: string;
  agentId: string;
  callerName: string;
  callerPhone: string;
  need: string;
  summary: string;
  address: string;
  urgency: string;
  transcript: TranscriptTurn[];
};

type OnboardingMatch = {
  id: string;
  business_name: string | null;
  staff_name: string | null;
  staff_contact: string | null;
  staff_email?: string | null;
  staff_phone?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function valueOf(item: unknown) {
  if (typeof item === 'string' || typeof item === 'number') return asString(item);
  const record = asRecord(item);
  return (
    asString(record.value) ||
    asString(record.result) ||
    asString(record.data) ||
    asString(record.extracted_value)
  );
}

function pickCollected(collected: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const direct = valueOf(collected[key]);
    if (direct) return direct;
    const needle = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = Object.entries(collected).find(([candidate]) =>
      candidate.toLowerCase().replace(/[^a-z0-9]/g, '').includes(needle),
    );
    const value = valueOf(found?.[1]);
    if (value) return value;
  }
  return '';
}

function phoneFromTranscript(transcript: TranscriptTurn[]) {
  const blob = transcript.map((turn) => turn.message).join('\n');
  const match = blob.match(/(?:\+?1[\s.-]*)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]*\d{4}/);
  return match ? toE164(match[0]) : '';
}

export function extractPostCallLead(event: unknown): ExtractedCallLead | null {
  const root = asRecord(event);
  if (root.type !== 'post_call_transcription') return null;

  const data = asRecord(root.data);
  const analysis = asRecord(data.analysis);
  const collected = asRecord(analysis.data_collection_results);
  const metadata = asRecord(data.metadata);
  const phoneCall = asRecord(metadata.phone_call);
  const transcript = (Array.isArray(data.transcript) ? data.transcript : []).map((turn) => {
    const row = asRecord(turn);
    return {
      role: asString(row.role),
      message: asString(row.message),
      timeInCallSecs:
        typeof row.time_in_call_secs === 'number' && Number.isFinite(row.time_in_call_secs)
          ? row.time_in_call_secs
          : null,
    };
  });

  const transcriptText = transcript
    .map((turn) => turn.message)
    .filter(Boolean)
    .join('\n')
    .slice(0, 4000);
  const summary =
    asString(analysis.transcript_summary) ||
    asString(analysis.call_summary_title) ||
    transcriptText ||
    'Completed Ava call';

  return {
    conversationId: asString(data.conversation_id),
    agentId: asString(data.agent_id),
    callerName: pickCollected(collected, 'caller_name', 'customer_name', 'name').slice(0, 200),
    callerPhone:
      toE164(pickCollected(collected, 'caller_phone', 'phone', 'callback_number', 'callback')) ||
      toE164(asString(phoneCall.external_number)) ||
      toE164(asString(phoneCall.from)) ||
      phoneFromTranscript(transcript),
    need: pickCollected(
      collected,
      'need',
      'service_job_type',
      'service',
      'job_type',
      'request',
      'reason',
    ).slice(0, 500),
    summary: summary.slice(0, 8000),
    address: pickCollected(collected, 'property_address', 'address').slice(0, 500),
    urgency: pickCollected(collected, 'intent_urgency', 'urgency', 'intent').slice(0, 200),
    transcript,
  };
}

async function findOnboardingByAgent(agentId: string): Promise<OnboardingMatch | null> {
  if (!agentId) return null;
  const supabase = createAdminClient();
  const full = await supabase
    .from('ava_onboardings')
    .select('id, business_name, staff_name, staff_contact, staff_email, staff_phone')
    .eq('elevenlabs_agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (!full.error) {
    return (full.data?.[0] as OnboardingMatch | undefined) ?? null;
  }

  const basic = await supabase
    .from('ava_onboardings')
    .select('id, business_name, staff_name, staff_contact')
    .eq('elevenlabs_agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (basic.error) {
    throw new Error(`Unable to match Ava agent: ${basic.error.message}`);
  }
  return (basic.data?.[0] as OnboardingMatch | undefined) ?? null;
}

function staffDestinations(match: OnboardingMatch | null) {
  const parsed = parseStaffContacts(
    [match?.staff_phone, match?.staff_email, match?.staff_contact].filter(Boolean).join(' '),
  );
  const email = match?.staff_email?.trim() || parsed.email || avaOwnerEmail();
  const phone = toE164(match?.staff_phone) || parsed.phone;
  return { email, phone };
}

type SavedLead = {
  id: string;
  notified_at: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  service_job_type: string | null;
  business_name: string | null;
  summary: string;
  conversation_id: string | null;
};

function isMissingColumn(message: string) {
  return /column .+ does not exist/i.test(message);
}

export async function savePostCallLead(lead: ExtractedCallLead) {
  if (!lead.conversationId) {
    return { skipped: true as const, reason: 'Missing conversation id.' };
  }

  const match = await findOnboardingByAgent(lead.agentId);
  const destinations = staffDestinations(match);
  const supabase = createAdminClient();
  const payload = {
    conversation_id: lead.conversationId,
    business_name: match?.business_name || null,
    business_type: null,
    caller_name: lead.callerName || null,
    caller_phone: lead.callerPhone || null,
    service_job_type: lead.need || null,
    property_address: lead.address || null,
    intent_urgency: lead.urgency || null,
    summary: lead.summary,
    transcript: lead.transcript,
    elevenlabs_agent_id: lead.agentId || null,
    onboarding_id: match?.id || null,
  };

  let saved = await supabase
    .from('ava_call_leads')
    .upsert(payload, { onConflict: 'conversation_id' })
    .select('*')
    .single();

  if (saved.error && isMissingColumn(saved.error.message)) {
    saved = await supabase
      .from('ava_call_leads')
      .upsert(
        {
          conversation_id: payload.conversation_id,
          business_name: payload.business_name,
          business_type: payload.business_type,
          caller_name: payload.caller_name,
          caller_phone: payload.caller_phone,
          service_job_type: payload.service_job_type,
          property_address: payload.property_address,
          intent_urgency: payload.intent_urgency,
          summary: payload.summary,
          transcript: payload.transcript,
        },
        { onConflict: 'conversation_id' },
      )
      .select('*')
      .single();
  }

  if (saved.error || !saved.data) {
    throw new Error(saved.error?.message || 'Unable to save Ava call lead.');
  }

  const row = saved.data as SavedLead;
  if (row.notified_at) {
    return { skipped: false as const, duplicate: true, leadId: row.id };
  }

  const subject = `New Ava lead${lead.callerName ? ` — ${lead.callerName}` : ''}${lead.need ? ` — ${lead.need}` : ''}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#17211b"><h1 style="font-size:22px">New Ava lead</h1><p>Ava finished a call for ${escapeHtml(match?.business_name || 'your business')}.</p><table style="border-collapse:collapse;width:100%"><tr><td><b>Caller</b></td><td>${escapeHtml(lead.callerName || 'Not provided')}</td></tr><tr><td><b>Phone</b></td><td>${escapeHtml(lead.callerPhone || 'Not provided')}</td></tr><tr><td><b>Need</b></td><td>${escapeHtml(lead.need || 'Not provided')}</td></tr><tr><td><b>Address</b></td><td>${escapeHtml(lead.address || 'Not provided')}</td></tr><tr><td><b>Urgency</b></td><td>${escapeHtml(lead.urgency || 'Not provided')}</td></tr></table><h2 style="font-size:18px">Summary</h2><p style="white-space:pre-wrap">${escapeHtml(lead.summary)}</p></div>`;

  await sendResendEmail({
    to: destinations.email,
    subject,
    html,
  });

  const sms = await sendAvaLeadSms({
    ...(destinations.phone ? { to: destinations.phone } : {}),
    body: formatAvaLeadSmsBody({
      caller_name: lead.callerName,
      caller_phone: lead.callerPhone,
      service_job_type: lead.need,
      business_name: match?.business_name,
    }),
  });
  if (!sms.sent && !sms.skipped) {
    console.error('Ava post-call SMS failed', sms.error);
  }

  const notifiedAt = new Date().toISOString();
  const { error: notifyError } = await supabase
    .from('ava_call_leads')
    .update({ notified_at: notifiedAt })
    .eq('id', row.id);
  if (notifyError) {
    console.error('Ava lead email sent, but notified_at was not saved', notifyError.message);
  }

  return { skipped: false as const, duplicate: false, leadId: row.id, sms };
}
