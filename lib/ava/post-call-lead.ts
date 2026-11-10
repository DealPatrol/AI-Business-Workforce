import { parseStaffContacts, toE164 } from '@/lib/analytics/contact';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatAvaLeadSmsBody, sendAvaLeadSms, type AvaLeadSmsResult } from '@/lib/ava/sms';
import { avaOwnerEmail, escapeHtml, sendResendEmail } from '@/lib/ava/mail';
import { decidePostCallGate, planPostCallEffects } from '@/lib/ava/post-call-gate';
import { isJunkCallType, meterStoreCall } from '@/lib/ava/store-call-billing';
import { findLeadByConversationId, insertLead } from '@/lib/leads/store';
import { getSiteUrl } from '@/lib/site-url';
import { bookingLinks, bookingWindowLabel } from '@/lib/ava/booking/event';
import { bookingForConversation, getCalendar } from '@/lib/ava/booking/store';
import { SMS_SKIPPED_NO_CONSENT, decideOwnerSms } from '@/lib/ava/sms-consent';

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
  callType: string;
  orderNumber: string;
  email: string;
  escalationReason: string;
  transcript: TranscriptTurn[];
};

type OnboardingMatch = {
  id: string;
  business_name: string | null;
  staff_name: string | null;
  staff_contact: string | null;
  staff_email?: string | null;
  staff_phone?: string | null;
  sms_consent?: boolean | null;
  elevenlabs_agent_id?: string | null;
  stripe_session_id?: string | null;
};

type CustomerGateRow = {
  id: string;
  product: string | null;
  subscription_status: string | null;
  plan?: string | null;
  stripe_customer_id?: string | null;
};

const CUSTOMER_GATE_SELECT = 'id, product, subscription_status, plan, stripe_customer_id';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function asScalar(value: unknown) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return asString(value);
}

function valueOf(item: unknown) {
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') return asScalar(item);
  const record = asRecord(item);
  return (
    asScalar(record.value) ||
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

/**
 * Agents report urgency differently: a word ("emergency", "soon", "routine") or a yes/no
 * "emergency" flag. Normalize the flag so the owner sees a word either way.
 */
export function normalizeUrgency(urgency: string, emergencyFlag: string) {
  const word = urgency.trim();
  if (word && !/^(true|false|yes|no)$/i.test(word)) return word;
  const flag = (word || emergencyFlag).trim().toLowerCase();
  if (flag === 'true' || flag === 'yes') return 'emergency';
  if (flag === 'false' || flag === 'no') return 'not an emergency';
  return emergencyFlag && !/^(true|false|yes|no)$/i.test(emergencyFlag) ? emergencyFlag.trim() : '';
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
    'Completed Executive Receptionist call';

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
      'issue',
      'service_job_type',
      'service',
      'job_type',
      'request',
      'reason',
    ).slice(0, 500),
    summary: summary.slice(0, 8000),
    address: pickCollected(collected, 'property_address', 'address').slice(0, 500),
    urgency: normalizeUrgency(
      pickCollected(collected, 'intent_urgency', 'urgency'),
      pickCollected(collected, 'emergency'),
    ).slice(0, 200),
    callType: pickCollected(collected, 'call_type').slice(0, 100),
    orderNumber: pickCollected(collected, 'order_number').slice(0, 100),
    email: pickCollected(collected, 'caller_email', 'email').slice(0, 200),
    escalationReason: pickCollected(collected, 'escalation_reason').slice(0, 500),
    transcript,
  };
}

async function listOnboardingsByAgent(agentId: string): Promise<OnboardingMatch[]> {
  if (!agentId.trim()) return [];
  const supabase = createAdminClient();
  // Newest schema first. Older schemas fall back so email routing keeps working, and a missing
  // sms_consent column leaves consent undefined, which the SMS gate treats as "no consent".
  const selects = [
    'id, business_name, staff_name, staff_contact, staff_email, staff_phone, sms_consent, elevenlabs_agent_id, stripe_session_id',
    'id, business_name, staff_name, staff_contact, staff_email, staff_phone, elevenlabs_agent_id, stripe_session_id',
    'id, business_name, staff_name, staff_contact, elevenlabs_agent_id, stripe_session_id',
  ];
  for (const [index, columns] of selects.entries()) {
    const result = await supabase
      .from('ava_onboardings')
      .select(columns)
      .eq('elevenlabs_agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(5);
    if (!result.error) return (result.data ?? []) as unknown as OnboardingMatch[];
    if (!isMissingColumn(result.error.message) || index === selects.length - 1) {
      throw new Error(`Unable to match Executive Receptionist agent: ${result.error.message}`);
    }
  }
  return [];
}

async function listCustomersForOnboarding(row: OnboardingMatch): Promise<CustomerGateRow[]> {
  const supabase = createAdminClient();
  const byOnboarding = await supabase
    .from('ava_customers')
    .select(CUSTOMER_GATE_SELECT)
    .eq('onboarding_id', row.id)
    .limit(5);
  if (byOnboarding.error) {
    throw new Error(`Unable to match Executive Receptionist customer: ${byOnboarding.error.message}`);
  }

  const rows = [...((byOnboarding.data ?? []) as CustomerGateRow[])];
  if (!row.stripe_session_id) return rows;

  const bySession = await supabase
    .from('ava_customers')
    .select(CUSTOMER_GATE_SELECT)
    .eq('stripe_checkout_session_id', row.stripe_session_id)
    .limit(5);
  if (bySession.error) {
    throw new Error(`Unable to match Executive Receptionist customer: ${bySession.error.message}`);
  }

  const seen = new Set(rows.map((item) => item.id));
  for (const candidate of (bySession.data ?? []) as CustomerGateRow[]) {
    if (!seen.has(candidate.id)) rows.push(candidate);
  }
  return rows;
}

/**
 * Reads the customer tables only. A miss returns ignored_agent and must not
 * insert a lead, send mail, or call Twilio.
 */
async function resolvePostCallTarget(agentId: string) {
  const onboardings = await listOnboardingsByAgent(agentId);
  for (const onboarding of onboardings) {
    const customers = await listCustomersForOnboarding(onboarding);
    for (const customer of customers) {
      const decision = decidePostCallGate({
        agentId,
        onboardingAgentId: onboarding.elevenlabs_agent_id ?? null,
        customerProduct: customer.product,
        subscriptionStatus: customer.subscription_status,
      });
      if (decision.process) return { decision, onboarding, customer };
    }
  }

  return {
    decision: decidePostCallGate({
      agentId,
      onboardingAgentId: null,
      customerProduct: null,
      subscriptionStatus: null,
    }),
    onboarding: null,
    customer: null as CustomerGateRow | null,
  };
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

/** Short "need" line for the Desk: the issue, plus the order number on store calls. */
export function deskJobType(lead: Pick<ExtractedCallLead, 'need' | 'orderNumber'>) {
  const need = lead.need.trim();
  const order = lead.orderNumber.trim();
  if (order && !need.includes(order)) return `${need || 'Order question'} (order ${order})`.slice(0, 500);
  return need.slice(0, 500);
}

/** Owner-only notes saved with the Desk lead: address, urgency, and store details. */
export function deskLeadNotes(lead: ExtractedCallLead, bookedWindow = '') {
  const lines: string[] = [];
  if (bookedWindow) lines.push(`Ava booked: ${bookedWindow}`);
  if (isJunkCallType(lead.callType)) lines.push(`Ava marked this call as ${lead.callType}.`);
  if (lead.address) lines.push(`Address: ${lead.address}`);
  if (lead.urgency) lines.push(`Urgency: ${lead.urgency}`);
  if (lead.email) lines.push(`Email: ${lead.email}`);
  if (lead.escalationReason) lines.push(`Needs a person: ${lead.escalationReason}`);
  return lines.join('\n').slice(0, 2000);
}

/** The slot Ava booked on this call, if any. Never throws. */
async function findCallBooking(conversationId: string, businessLabel: string) {
  try {
    const booking = await bookingForConversation(conversationId);
    if (!booking) return null;
    const calendar = await getCalendar(booking.calendar_id);
    const window = bookingWindowLabel(booking, calendar?.timezone || 'America/Chicago');
    return { booking, window, ...bookingLinks(booking, businessLabel) };
  } catch (error) {
    console.error('Unable to look up the booking for %s', conversationId, error);
    return null;
  }
}

/**
 * Puts the call on the customer's Desk (er_leads). Idempotent per conversation and never throws,
 * so a Desk hiccup cannot block the owner's email.
 */
async function mirrorCallToDesk(lead: ExtractedCallLead, clientId: string | null, bookedWindow = '') {
  if (!clientId || !lead.conversationId) return { mirrored: false as const, reason: 'no_client' };
  try {
    const existing = await findLeadByConversationId(lead.conversationId);
    if (existing) return { mirrored: false as const, reason: 'already_on_desk' };
    await insertLead({
      clientId,
      callerName: lead.callerName || undefined,
      callerPhone: lead.callerPhone || undefined,
      jobType: deskJobType(lead) || undefined,
      summary: lead.summary,
      conversationId: lead.conversationId,
      agentId: lead.agentId || undefined,
      source: 'receptionist call',
      notes: deskLeadNotes(lead, bookedWindow),
      status: isJunkCallType(lead.callType) ? 'Not a fit' : 'New',
    });
    return { mirrored: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/duplicate|unique/i.test(message)) return { mirrored: false as const, reason: 'already_on_desk' };
    console.error('Unable to put call %s on the Desk: %s', lead.conversationId, message);
    return { mirrored: false as const, reason: 'error' };
  }
}

export async function savePostCallLead(lead: ExtractedCallLead) {
  const target = await resolvePostCallTarget(lead.agentId);
  // Owner text needs recorded SMS consent and a staff phone. Email is not affected.
  const ownerSms = decideOwnerSms({
    smsConsent: target.onboarding?.sms_consent,
    phone: target.onboarding ? staffDestinations(target.onboarding).phone : '',
  });
  const effects = planPostCallEffects(target.decision, { smsAllowed: ownerSms.send });
  // Demo agents, Executive Receptionist, and any other unknown agent_id stop here.
  // effects.sendSms is false, so Twilio is not called and no credit is spent.
  if (!effects.saveLead || !target.onboarding) {
    return { skipped: true as const, reason: 'ignored_agent' as const };
  }

  if (!lead.conversationId) {
    return { skipped: true as const, reason: 'Missing conversation id.' };
  }

  const match = target.onboarding;
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
    throw new Error(saved.error?.message || 'Unable to save Executive Receptionist call lead.');
  }

  const row = saved.data as SavedLead;

  const booked = await findCallBooking(lead.conversationId, match?.business_name || 'Ava booking');
  await mirrorCallToDesk(lead, target.customer?.id ?? null, booked?.window ?? '');

  // Online Store plan: $1 per handled call. Idempotent per conversation; never blocks the lead.
  const storeMeter = await meterStoreCall({
    customer: target.customer
      ? {
          plan: target.customer.plan ?? null,
          stripe_customer_id: target.customer.stripe_customer_id ?? null,
          subscription_status: target.customer.subscription_status,
        }
      : null,
    conversationId: lead.conversationId,
    transcript: lead.transcript,
    callType: lead.callType,
  });
  if (storeMeter.metered || storeMeter.reason !== 'not_store') {
    console.info('Store call meter for %s: %s', lead.conversationId, storeMeter.metered ? 'sent' : storeMeter.reason);
  }

  if (row.notified_at) {
    return { skipped: false as const, duplicate: true, leadId: row.id };
  }

  const subject = `${booked ? 'Booked by Ava' : 'New Executive Receptionist lead'}${lead.callerName ? ` — ${lead.callerName}` : ''}${lead.need ? ` — ${lead.need}` : ''}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#17211b"><h1 style="font-size:22px">New Executive Receptionist lead</h1><p>Executive Receptionist finished a call for ${escapeHtml(match?.business_name || 'your business')}.</p><table style="border-collapse:collapse;width:100%"><tr><td><b>Caller</b></td><td>${escapeHtml(lead.callerName || 'Not provided')}</td></tr><tr><td><b>Phone</b></td><td>${escapeHtml(lead.callerPhone || 'Not provided')}</td></tr><tr><td><b>Need</b></td><td>${escapeHtml(lead.need || 'Not provided')}</td></tr><tr><td><b>Address</b></td><td>${escapeHtml(lead.address || 'Not provided')}</td></tr><tr><td><b>Urgency</b></td><td>${escapeHtml(lead.urgency || 'Not provided')}</td></tr>${lead.orderNumber ? `<tr><td><b>Order</b></td><td>${escapeHtml(lead.orderNumber)}</td></tr>` : ''}${lead.email ? `<tr><td><b>Email</b></td><td>${escapeHtml(lead.email)}</td></tr>` : ''}${lead.escalationReason ? `<tr><td><b>Needs a person</b></td><td>${escapeHtml(lead.escalationReason)}</td></tr>` : ''}</table>${booked ? `<p style="background:#eef5ef;padding:12px;border-radius:8px"><b>Ava booked this caller for ${escapeHtml(booked.window)}.</b><br><a href="${escapeHtml(booked.googleUrl)}">Add to Google Calendar</a>${booked.icsUrl ? ` · <a href="${escapeHtml(booked.icsUrl)}">Download .ics (Outlook, Apple)</a>` : ''}</p>` : ''}<p>Transcript and recording: <a href="${escapeHtml(`${getSiteUrl()}/desk`)}">open your Desk</a>.</p><h2 style="font-size:18px">Summary</h2><p style="white-space:pre-wrap">${escapeHtml(lead.summary)}</p></div>`;

  let sms: AvaLeadSmsResult = { ...SMS_SKIPPED_NO_CONSENT };
  if (effects.sendEmail) {
    await sendResendEmail({
      to: destinations.email,
      subject,
      html,
    });
  }

  if (effects.sendSms && ownerSms.send) {
    sms = await sendAvaLeadSms({
      to: ownerSms.to,
      body: formatAvaLeadSmsBody({
        caller_name: lead.callerName,
        caller_phone: lead.callerPhone,
        service_job_type: lead.need,
        business_name: match.business_name,
      }),
    });
    if (!sms.sent && !sms.skipped) {
      console.error('Executive Receptionist post-call SMS failed', sms.error);
    }
  }

  const notifiedAt = new Date().toISOString();
  const { error: notifyError } = await supabase
    .from('ava_call_leads')
    .update({ notified_at: notifiedAt })
    .eq('id', row.id);
  if (notifyError) {
    console.error('Executive Receptionist lead email sent, but notified_at was not saved', notifyError.message);
  }

  return { skipped: false as const, duplicate: false, leadId: row.id, sms };
}
