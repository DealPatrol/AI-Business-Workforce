import type { SupabaseClient } from '@supabase/supabase-js';
import { ProspectorSetupError, ValidationError } from '@/lib/prospector/errors';
import { buildCanSpamFooter, evaluateSend, startOfUtcDay } from '@/lib/prospector/gates';
import { renderHtmlEmail, renderPlainEmail, sendProspectorEmail } from '@/lib/prospector/resend';
import {
  findSentDraft,
  getDraft,
  getLead,
  getSettings,
  insertSend,
  lastSentAtMs,
  listSuppressedEmails,
  sentTodayCount,
  updateLead,
} from '@/lib/prospector/store';
import type { ProspectorLead, ProspectorSend } from '@/lib/prospector/types';
import { unsubscribeUrl } from '@/lib/prospector/unsubscribe-token';

export type DeliverOutcome =
  | { ok: true; send: ProspectorSend; lead: ProspectorLead; alreadySent: boolean }
  | { ok: false; status: number; message: string; retryAfterSeconds?: number; code?: string; send?: ProspectorSend };

function closedLeadStatus(status: ProspectorLead['status']) {
  return status === 'do_not_contact' || status === 'not_interested';
}

export async function deliverDraft(
  supabase: SupabaseClient,
  ownerId: string,
  draftId: string,
  requestedEmail?: string,
): Promise<DeliverOutcome> {
  const draft = await getDraft(supabase, ownerId, draftId);
  if (!draft) return { ok: false, status: 404, message: 'Draft not found.' };
  const lead = await getLead(supabase, ownerId, draft.leadId);
  if (!lead) return { ok: false, status: 404, message: 'Lead not found.' };
  if (closedLeadStatus(lead.status)) {
    return { ok: false, status: 400, message: 'This lead is marked do-not-contact or not interested.' };
  }

  const existing = await findSentDraft(supabase, ownerId, draft.id);
  if (existing) {
    return { ok: true, send: existing, lead, alreadySent: true };
  }

  const settings = await getSettings(supabase, ownerId);
  const suppressed = await listSuppressedEmails(supabase, ownerId);
  const nowMs = Date.now();
  const chosen = (requestedEmail || lead.emails[0] || '').trim();
  if (requestedEmail && !lead.emails.some((email) => email.toLowerCase() === requestedEmail.trim().toLowerCase())) {
    throw new ValidationError('Choose an email address that was found for this lead.');
  }

  const gate = evaluateSend({
    approved: Boolean(draft.approvedAt),
    toEmail: chosen,
    subject: draft.subject,
    body: draft.body,
    suppressedEmails: suppressed,
    sentToday: await sentTodayCount(supabase, ownerId, startOfUtcDay(nowMs)),
    dailyCap: settings.dailyCap,
    lastSentAtMs: await lastSentAtMs(supabase, ownerId),
    nowMs,
    spacingSeconds: settings.sendSpacingSeconds,
    mailingAddress: settings.mailingAddress,
    senderName: settings.senderName,
    senderEmail: settings.senderEmail,
  });

  if (!gate.ok && gate.code === 'suppressed') {
    const send = await insertSend(supabase, {
      ownerId,
      leadId: lead.id,
      draftId: draft.id,
      toEmail: chosen.trim().toLowerCase(),
      fromEmail: settings.senderEmail,
      subject: draft.subject,
      body: draft.body,
      status: 'suppressed',
      error: gate.message,
    });
    await updateLead(supabase, ownerId, lead.id, { status: 'do_not_contact' });
    return { ok: false, status: 409, message: gate.message, code: gate.code, send };
  }

  if (!gate.ok) {
    const status = gate.code === 'spacing' || gate.code === 'daily_cap' ? 429 : 400;
    return { ok: false, status, message: gate.message, code: gate.code, retryAfterSeconds: gate.retryAfterSeconds };
  }

  const link = unsubscribeUrl(ownerId, gate.toEmail);
  if (!link) {
    return {
      ok: false,
      status: 503,
      message: 'Unsubscribe links need PROSPECTOR_UNSUBSCRIBE_SECRET or SUPABASE_SECRET_KEY. Nothing was sent.',
    };
  }

  const footer = buildCanSpamFooter({
    senderName: settings.senderName,
    mailingAddress: settings.mailingAddress,
    unsubscribeUrl: link,
  });
  const text = renderPlainEmail(draft.body, footer);
  const html = renderHtmlEmail(draft.body, footer);

  try {
    const result = await sendProspectorEmail({
      from: gate.fromHeader,
      to: gate.toEmail,
      subject: gate.subject,
      text,
      html,
      unsubscribeUrl: link,
    });
    const send = await insertSend(supabase, {
      ownerId,
      leadId: lead.id,
      draftId: draft.id,
      toEmail: gate.toEmail,
      fromEmail: gate.fromHeader,
      subject: gate.subject,
      body: text,
      providerMessageId: result.id,
      status: 'sent',
      sentAt: new Date().toISOString(),
    });
    const updated =
      (await updateLead(supabase, ownerId, lead.id, {
        status: 'sent',
      })) ?? lead;
    return { ok: true, send, lead: updated, alreadySent: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The email could not be sent.';
    if (error instanceof ProspectorSetupError) {
      return { ok: false, status: 503, message };
    }
    const send = await insertSend(supabase, {
      ownerId,
      leadId: lead.id,
      draftId: draft.id,
      toEmail: gate.toEmail,
      fromEmail: gate.fromHeader,
      subject: gate.subject,
      body: text,
      status: 'failed',
      error: message.slice(0, 400),
    });
    return { ok: false, status: 502, message, send };
  }
}
