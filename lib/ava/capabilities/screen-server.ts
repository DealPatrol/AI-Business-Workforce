/** Server side of the screening line: Twilio signature check, state changes and the give-up path. */
import { getCalendar, type CalendarRow } from '@/lib/ava/booking/store';
import { handleCallback } from '@/lib/ava/capabilities/callback';
import { callbackDeps, pageOnCall } from '@/lib/ava/capabilities/server';
import {
  acceptTwiml,
  nextStep,
  nextTwiml,
  screenTwiml,
  whisperTwiml,
  type ScreenUrls,
} from '@/lib/ava/capabilities/screen';
import { pendingTransferForCaller, transferById, updateTransfer, type TransferRecord } from '@/lib/ava/capabilities/store';
import { validateTwilioSignature } from '@/lib/twilio/signature';
import type { TwilioRequest } from '@/lib/twilio/missed-call';

export type ScreenStep = 'screen' | 'whisper' | 'accept' | 'next';

const EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response/>';

export function screenUrls(base: string): ScreenUrls {
  const root = base.replace(/\/$/, '');
  return {
    whisper: `${root}/api/twilio/transfer/whisper`,
    accept: `${root}/api/twilio/transfer/accept`,
    next: `${root}/api/twilio/transfer/next`,
  };
}

/** Pages (emergencies) and holds the earliest callback window, so the caller hears a real next step. */
async function giveUp(transfer: TransferRecord) {
  let paged = false;
  let callbackWindow: string | null = null;
  const calendar: CalendarRow | null = await getCalendar(transfer.calendar_id).catch(() => null);
  if (!calendar) return { paged, callbackWindow };
  if (transfer.urgent) {
    const page = await pageOnCall(calendar, {
      callerName: transfer.caller_name || '',
      callerPhone: transfer.caller_phone || '',
      address: transfer.address || '',
      issue: transfer.issue || '',
      reason: 'transfer_unanswered',
      conversationId: transfer.conversation_id || '',
    }).catch(() => null);
    paged = Boolean(page?.paged);
  }
  if (transfer.caller_phone) {
    const deps = callbackDeps((work) => void work().catch(() => undefined));
    const now = new Date();
    const offer = await handleCallback(calendar, { conversation_id: transfer.conversation_id || '' }, now, deps).catch(() => null);
    const first = offer && 'windows' in offer && Array.isArray(offer.windows) ? offer.windows[0] : null;
    if (offer && 'already_held' in offer && offer.already_held) callbackWindow = String(offer.window || '') || null;
    else if (first) {
      const held = await handleCallback(
        calendar,
        {
          slot_start: first.slot_start,
          caller_name: transfer.caller_name || 'Caller',
          caller_phone: transfer.caller_phone,
          issue: transfer.issue || 'Transfer was not answered',
          conversation_id: transfer.conversation_id || '',
        },
        now,
        deps,
      ).catch(() => null);
      if (held && held.held && 'window' in held) callbackWindow = String(held.window || '') || null;
    }
  }
  return { paged, callbackWindow };
}

export async function handleScreenStep(step: ScreenStep, req: TwilioRequest, query: URLSearchParams, base: string, authToken: string) {
  if (!authToken) return { status: 503, body: EMPTY };
  if (!validateTwilioSignature({ authToken, signature: req.signature, urls: req.urls, params: req.params })) {
    return { status: 403, body: EMPTY };
  }
  const urls = screenUrls(base);
  if (step === 'screen') {
    const transfer = await pendingTransferForCaller(req.params.From || '').catch(() => null);
    if (transfer) await updateTransfer(transfer.id, { status: 'ringing' }).catch(() => undefined);
    // screenTwiml dials only a 'pending' transfer; it was pending when read.
    return { status: 200, body: screenTwiml(transfer ? { ...transfer, status: 'pending' } : null, urls) };
  }
  const transfer = await transferById(query.get('t') || '').catch(() => null);
  if (step === 'whisper') return { status: 200, body: whisperTwiml(transfer, urls) };
  if (step === 'accept') {
    const result = acceptTwiml(req.params.Digits || '');
    if (result.accepted && transfer) {
      await updateTransfer(transfer.id, { status: 'accepted', accepted_at: new Date().toISOString() }).catch(() => undefined);
    }
    return { status: 200, body: result.body };
  }
  // next
  const index = Number(query.get('i'));
  const stepNext = nextStep(transfer, Number.isFinite(index) ? index : 99);
  if (stepNext.kind === 'give_up' && transfer) {
    await updateTransfer(transfer.id, { status: 'unanswered' }).catch(() => undefined);
    return { status: 200, body: nextTwiml(stepNext, transfer, urls, await giveUp(transfer)) };
  }
  return { status: 200, body: nextTwiml(stepNext, transfer, urls, { paged: false }) };
}
