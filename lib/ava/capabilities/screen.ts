/**
 * Pure TwiML for the voicemail-safe transfer screen ("press 1 to accept").
 *
 * Call flow on the screening number (AVA_TRANSFER_SCREEN_NUMBER):
 *   screen  -> Dial owner number #1, whisper the briefing to whoever answers
 *   whisper -> "press 1 to take this call"; no key press = hang up that leg (voicemail never gets the caller)
 *   accept  -> Digits=1 marks the transfer accepted and bridges the caller
 *   next    -> Dial ended: if accepted we are done; else try number #2, #3; else tell the caller what happens next
 */

export const SCREEN_VOICE = 'Polly.Joanna-Neural';
export const RING_SECONDS = 20;
export const WHISPER_GATHER_SECONDS = 6;

export type PendingTransfer = {
  id: string;
  numbers: string[];
  brief: string;
  status: 'pending' | 'ringing' | 'accepted' | 'unanswered' | 'expired';
  urgent: boolean;
  accepted_at?: string | null;
};

export function escapeXml(value: string) {
  return String(value).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] || c);
}

function say(text: string) {
  return `<Say voice="${SCREEN_VOICE}">${escapeXml(text)}</Say>`;
}

function withParams(base: string, params: Record<string, string | number>) {
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  return url.toString();
}

export type ScreenUrls = { whisper: string; accept: string; next: string };

/** Dial one owner number with the whisper attached. */
export function dialNumberTwiml(transfer: PendingTransfer, index: number, urls: ScreenUrls) {
  const number = transfer.numbers[index];
  const action = withParams(urls.next, { t: transfer.id, i: index });
  const whisper = withParams(urls.whisper, { t: transfer.id });
  return `<Dial timeout="${RING_SECONDS}" answerOnBridge="true" action="${escapeXml(action)}" method="POST"><Number url="${escapeXml(whisper)}" method="POST">${escapeXml(number)}</Number></Dial>`;
}

/** First TwiML the screening number returns. No pending transfer = polite fallback, never a dead line. */
export function screenTwiml(transfer: PendingTransfer | null, urls: ScreenUrls) {
  if (!transfer || transfer.numbers.length === 0 || transfer.status !== 'pending') {
    return `<?xml version="1.0" encoding="UTF-8"?><Response>${say(
      "I'm sorry, I couldn't connect you just now. Your details were already passed to the team, and they will call you back. If this is a safety emergency, hang up and call 9 1 1.",
    )}<Hangup/></Response>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${say('Please hold while I connect you.')}${dialNumberTwiml(transfer, 0, urls)}</Response>`;
}

/** Read to the person who answers. Only a key press of 1 connects the caller. */
export function whisperTwiml(transfer: PendingTransfer | null, urls: ScreenUrls) {
  if (!transfer) return `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`;
  const accept = withParams(urls.accept, { t: transfer.id });
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Gather numDigits="1" timeout="${WHISPER_GATHER_SECONDS}" action="${escapeXml(accept)}" method="POST">${say(
    `${transfer.brief} Press 1 to take this call.`,
  )}${say('Press 1 to take the call.')}</Gather><Hangup/></Response>`;
}

/** Callee pressed a key. Only "1" accepts; an empty Response lets Twilio bridge the two legs. */
export function acceptTwiml(digits: string) {
  if (String(digits || '').trim() === '1') {
    return { accepted: true, body: `<?xml version="1.0" encoding="UTF-8"?><Response>${say('Connecting you now.')}</Response>` };
  }
  return { accepted: false, body: `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>` };
}

export type NextStep =
  | { kind: 'done' }
  | { kind: 'dial'; index: number }
  | { kind: 'give_up' };

/** What happens after a Dial ends. Accepted calls are finished; otherwise try the next number. */
export function nextStep(transfer: PendingTransfer | null, index: number): NextStep {
  if (!transfer) return { kind: 'give_up' };
  if (transfer.status === 'accepted' || transfer.accepted_at) return { kind: 'done' };
  const next = Number.isFinite(index) ? index + 1 : transfer.numbers.length;
  if (next < transfer.numbers.length) return { kind: 'dial', index: next };
  return { kind: 'give_up' };
}

/** What the caller hears when nobody pressed 1. `callbackWindow` comes from a held callback booking. */
export function giveUpTwiml(opts: { paged: boolean; callbackWindow?: string | null }) {
  const parts = ["I'm sorry, nobody on the team could pick up right now."];
  if (opts.paged) parts.push('I have paged the on-call team with your details.');
  if (opts.callbackWindow) parts.push(`I've held a callback for ${opts.callbackWindow}, at the number you gave.`);
  else parts.push('They have your details and will call you back at the number you gave.');
  parts.push('If this is a safety emergency, hang up and call 9 1 1. Goodbye.');
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${say(parts.join(' '))}<Hangup/></Response>`;
}

export function nextTwiml(step: NextStep, transfer: PendingTransfer | null, urls: ScreenUrls, giveUp: { paged: boolean; callbackWindow?: string | null }) {
  if (step.kind === 'done') return `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`;
  if (step.kind === 'dial' && transfer) {
    return `<?xml version="1.0" encoding="UTF-8"?><Response>${say('Still trying. Please hold.')}${dialNumberTwiml(transfer, step.index, urls)}</Response>`;
  }
  return giveUpTwiml(giveUp);
}
