/** Supabase access for callbacks, on-call pages and screened transfers. */
import { createAdminClient } from '@/lib/supabase/admin';
import { listBookings, type CalendarRow } from '@/lib/ava/booking/store';
import type { CallbackRow } from '@/lib/ava/capabilities/callback';
import { normalizeOnCall, type OnCallContact, type PagePlan, type PageInput } from '@/lib/ava/capabilities/paging';
import { normalizeTransferRules, type TransferRule } from '@/lib/ava/capabilities/transfer';
import type { PendingTransfer } from '@/lib/ava/capabilities/screen';

export type CapabilityContext = {
  businessName: string;
  ownerEmail: string;
  onCall: OnCallContact[];
  transferRules: TransferRule[];
};

const EMAIL_IN_TEXT = /[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+/;

/**
 * Business name, owner email, on-call list and transfer numbers for a calendar's business. When no on-call
 * list was entered, the owner's email is the on-call contact, so an emergency page always reaches someone.
 */
export async function capabilityContext(calendar: CalendarRow, fallbackEmail: string): Promise<CapabilityContext> {
  const base: CapabilityContext = { businessName: calendar.label || 'your business', ownerEmail: fallbackEmail, onCall: [], transferRules: [] };
  if (!calendar.onboarding_id) return { ...base, onCall: [{ name: 'Owner', email: fallbackEmail }] };
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('ava_onboardings').select('*').eq('id', calendar.onboarding_id).maybeSingle();
  if (error || !data) return { ...base, onCall: [{ name: 'Owner', email: fallbackEmail }] };
  const row = data as Record<string, unknown>;
  const staffEmail =
    (typeof row.staff_email === 'string' && row.staff_email.trim()) ||
    (typeof row.staff_contact === 'string' && row.staff_contact.match(EMAIL_IN_TEXT)?.[0]) ||
    fallbackEmail;
  const onCall = normalizeOnCall(row.on_call_contacts);
  return {
    businessName: String(row.business_name || calendar.label || 'your business'),
    ownerEmail: staffEmail,
    onCall: onCall.length ? onCall : [{ name: String(row.staff_name || 'Owner'), email: staffEmail }],
    transferRules: normalizeTransferRules({ transferRules: row.transfer_rules, transferNumber: (row.transfer_phone as string) || null }),
  };
}

export async function listHeldCallbacks(calendarId: string, fromIso: string, toIso: string) {
  return listBookings(calendarId, fromIso, toIso, 'callback');
}

export async function callbackForConversation(conversationId: string): Promise<CallbackRow | null> {
  if (!conversationId) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_bookings')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('status', 'booked')
    .eq('kind', 'callback')
    .limit(1);
  if (error) return null;
  return ((data ?? [])[0] as CallbackRow | undefined) ?? null;
}

export async function insertCallback(row: Omit<CallbackRow, 'id'>): Promise<CallbackRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_bookings')
    .insert({ ...row, kind: 'callback', status: 'booked' })
    .select('*')
    .single();
  if (error) throw new Error(`Unable to hold callback: ${error.message}`);
  return data as CallbackRow;
}

export async function recordCallbackAlert(id: string, patch: { owner_alert_status?: string; sms_status?: string; sms_sid?: string }) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('ava_bookings').update(patch).eq('id', id);
    if (error) console.error('Unable to record callback alert', error.message);
  } catch (error) {
    console.error('Unable to record callback alert', error);
  }
}

export async function conversationAlreadyPaged(conversationId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('ava_pages').select('id').eq('conversation_id', conversationId).limit(1);
  if (error) return false;
  return (data ?? []).length > 0;
}

export async function recordPage(calendarId: string, entry: { conversationId: string; plan: PagePlan; delivered: { email: number; sms: number }; failed: number; input: PageInput }) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('ava_pages').insert({
    calendar_id: calendarId,
    conversation_id: entry.conversationId || null,
    reason: entry.input.reason,
    caller_name: entry.input.callerName || null,
    caller_phone: entry.input.callerPhone || null,
    issue: entry.input.issue || null,
    emails_sent: entry.delivered.email,
    texts_sent: entry.delivered.sms,
    failed: entry.failed,
    texts_skipped: entry.plan.skippedTexts.map((s) => s.reason),
  });
  if (error) throw new Error(error.message);
}

/** A screened transfer waiting for the screening line, keyed by the caller's own number. */
export async function createPendingTransfer(input: {
  calendarId: string;
  conversationId: string;
  callerId: string;
  numbers: string[];
  brief: string;
  urgent: boolean;
  callerName: string;
  callerPhone: string;
  address: string;
  issue: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_transfers')
    .insert({
      calendar_id: input.calendarId,
      conversation_id: input.conversationId || null,
      caller_id: input.callerId,
      numbers: input.numbers,
      brief: input.brief,
      urgent: input.urgent,
      caller_name: input.callerName || null,
      caller_phone: input.callerPhone || null,
      address: input.address || null,
      issue: input.issue || null,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error) throw new Error(`Unable to save transfer: ${error.message}`);
  return String((data as { id: string }).id);
}

export type TransferRecord = PendingTransfer & {
  calendar_id: string;
  conversation_id: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  address: string | null;
  issue: string | null;
};

/** Newest pending transfer for this caller in the last five minutes. */
export async function pendingTransferForCaller(callerId: string, now = new Date()): Promise<TransferRecord | null> {
  if (!callerId) return null;
  const supabase = createAdminClient();
  const since = new Date(now.getTime() - 5 * 60_000).toISOString();
  const { data, error } = await supabase
    .from('ava_transfers')
    .select('*')
    .eq('caller_id', callerId)
    .eq('status', 'pending')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return ((data ?? [])[0] as TransferRecord | undefined) ?? null;
}

export async function transferById(id: string): Promise<TransferRecord | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('ava_transfers').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as TransferRecord | null) ?? null;
}

export async function updateTransfer(id: string, patch: Partial<Pick<TransferRecord, 'status' | 'accepted_at'>>) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('ava_transfers').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}
