import { sendAvaLeadSms, type AvaLeadSmsResult } from '../ava/sms';
import { validateTwilioSignature } from './signature';
import { createRateLimiter } from '../rate-limit';

/**
 * Missed-Call Text-Back.
 *
 * Twilio number webhooks:
 *   Voice  "A call comes in"   -> POST /api/twilio/voice
 *   (Dial action callback)     -> POST /api/twilio/voice/status
 *   Messaging "A message comes in" -> POST /api/twilio/sms
 *
 * Handlers are plain functions (no Next.js imports) so they can be unit tested.
 */

export const DEFAULT_MISSED_CALL_TEXT_TEMPLATE =
  "Sorry we missed your call! We're with a customer right now. Reply to this text with what you need and we'll get right back to you. Reply STOP to opt out.";

const OPT_OUT_NOTICE = ' Reply STOP to opt out.';
/** US/Canada geographic or toll-free NANP numbers only: blocks premium/international SMS pumping. */
const NANP = /^\+1[2-9]\d{2}[2-9]\d{6}$/;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
let callerTextLimiter = createRateLimiter(1, DAY_MS); // 1 auto-text per caller per 24h
let ownerAlertLimiter = createRateLimiter(30, HOUR_MS); // global cap on owner alerts
let smsForwardLimiter = createRateLimiter(10, HOUR_MS); // per-sender reply forwards

/** Test hook: reset the in-memory (per-instance, best-effort) limiters. */
export function resetMissedCallLimitsForTests() {
  callerTextLimiter = createRateLimiter(1, DAY_MS);
  ownerAlertLimiter = createRateLimiter(30, HOUR_MS);
  smsForwardLimiter = createRateLimiter(10, HOUR_MS);
}

export const DIAL_TIMEOUT_SECONDS = 20;
export const VOICE_STATUS_PATH = '/api/twilio/voice/status';

const MISSED_DIAL_STATUSES = new Set(['no-answer', 'busy', 'failed']);
const E164 = /^\+[1-9]\d{6,14}$/;

export type MissedCallEnv = {
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;
  MISSED_CALL_FORWARD_NUMBER?: string;
  MISSED_CALL_TEXT_TEMPLATE?: string;
  AVA_LEAD_SMS_TO?: string;
};

export type TwilioRequest = {
  /** Candidate public URLs Twilio may have signed (see requestUrlCandidates). */
  urls: string[];
  signature: string;
  params: Record<string, string>;
};

export type TwimlResponse = { status: number; body: string };

export type SendSms = (opts: { to: string; body: string }) => Promise<AvaLeadSmsResult>;

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function twiml(inner = ''): string {
  return `${XML_HEADER}<Response>${inner}</Response>`;
}

export function emptyTwiml(): string {
  return twiml();
}

function clean(value: string | undefined): string {
  return (value || '').trim();
}

export function isE164(value: string | undefined): boolean {
  return E164.test(clean(value));
}

/** Numbers we must never auto-text (our own lines / the owner) to avoid loops. */
function ownNumbers(env: MissedCallEnv): Set<string> {
  return new Set(
    [env.TWILIO_FROM_NUMBER, env.MISSED_CALL_FORWARD_NUMBER, env.AVA_LEAD_SMS_TO].map(clean).filter(Boolean),
  );
}

/** Only real, US/Canada callers that are not our own numbers get a text-back. */
export function isTextableCaller(caller: string, env: MissedCallEnv): boolean {
  return NANP.test(caller) && !ownNumbers(env).has(caller);
}

/** Owner alert destination: AVA_LEAD_SMS_TO, falling back to the forwarding number. */
export function ownerAlertNumber(env: MissedCallEnv): string {
  return clean(env.AVA_LEAD_SMS_TO) || clean(env.MISSED_CALL_FORWARD_NUMBER);
}

export function missedCallTextBody(env: MissedCallEnv): string {
  let body = (clean(env.MISSED_CALL_TEXT_TEMPLATE) || DEFAULT_MISSED_CALL_TEXT_TEMPLATE).slice(0, 600);
  if (!/\bSTOP\b/i.test(body)) body += OPT_OUT_NOTICE;
  return body;
}

/** Convert form-encoded body text into a flat string record. */
export function parseTwilioForm(rawBody: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(rawBody)) params[key] = value;
  return params;
}

/**
 * Build the public URLs Twilio may have signed. Vercel/proxies can change the
 * host/protocol the server sees, so try the forwarded host as well.
 */
export function requestUrlCandidates(
  requestUrl: string,
  headers: { get(name: string): string | null },
): string[] {
  const candidates = [requestUrl];
  try {
    const parsed = new URL(requestUrl);
    const host = headers.get('x-forwarded-host') || headers.get('host');
    const proto = (headers.get('x-forwarded-proto') || 'https').split(',')[0].trim();
    if (host) candidates.push(`${proto}://${host.split(',')[0].trim()}${parsed.pathname}${parsed.search}`);
  } catch {
    // keep the raw URL only
  }
  return Array.from(new Set(candidates));
}

type AuthResult = { ok: true } | { ok: false; response: TwimlResponse };

function authorize(req: TwilioRequest, env: MissedCallEnv): AuthResult {
  const authToken = clean(env.TWILIO_AUTH_TOKEN);
  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN is not set; refusing to trust Twilio webhook.');
    return { ok: false, response: { status: 503, body: emptyTwiml() } };
  }
  const valid = validateTwilioSignature({
    authToken,
    signature: req.signature,
    urls: req.urls,
    params: req.params,
  });
  if (!valid) return { ok: false, response: { status: 403, body: emptyTwiml() } };
  return { ok: true };
}

const UNAVAILABLE_SAY =
  '<Say voice="Polly.Joanna">Sorry, we are unable to take your call right now. Please try again shortly.</Say><Hangup/>';

/** POST /api/twilio/voice: ring the owner's phone, then fall through to the status callback. */
export function handleIncomingVoice(
  req: TwilioRequest,
  env: MissedCallEnv,
  statusCallbackUrl: string,
): TwimlResponse {
  const auth = authorize(req, env);
  if (!auth.ok) return auth.response;

  const forwardTo = clean(env.MISSED_CALL_FORWARD_NUMBER);
  if (!forwardTo) {
    console.error('MISSED_CALL_FORWARD_NUMBER is not set; cannot forward call.');
    return { status: 200, body: twiml(UNAVAILABLE_SAY) };
  }

  const caller = clean(req.params.From);
  const callerIdAttr = isE164(caller) ? ` callerId="${escapeXml(caller)}"` : '';
  const dial =
    `<Dial timeout="${DIAL_TIMEOUT_SECONDS}" answerOnBridge="true" action="${escapeXml(statusCallbackUrl)}" method="POST"${callerIdAttr}>` +
    `<Number>${escapeXml(forwardTo)}</Number></Dial>`;
  return { status: 200, body: twiml(dial) };
}

export type MissedCallOutcome = {
  missed: boolean;
  callerTexted?: AvaLeadSmsResult;
  ownerAlerted?: AvaLeadSmsResult;
};

/** POST /api/twilio/voice/status: Dial action callback. Texts back on a missed call. */
export async function handleVoiceStatus(
  req: TwilioRequest,
  env: MissedCallEnv,
  sendSms: SendSms = sendAvaLeadSms,
): Promise<TwimlResponse & { outcome?: MissedCallOutcome }> {
  const auth = authorize(req, env);
  if (!auth.ok) return auth.response;

  const dialStatus = clean(req.params.DialCallStatus || req.params.CallStatus).toLowerCase();
  if (!MISSED_DIAL_STATUSES.has(dialStatus)) {
    // Answered/completed (or caller hung up first): nothing to do.
    return { status: 200, body: emptyTwiml(), outcome: { missed: false } };
  }

  const outcome: MissedCallOutcome = { missed: true };
  const caller = clean(req.params.From);
  const smsConfigured = Boolean(
    clean(env.TWILIO_ACCOUNT_SID) && clean(env.TWILIO_AUTH_TOKEN) && clean(env.TWILIO_FROM_NUMBER),
  );

  if (!smsConfigured) {
    console.error('Twilio SMS env (TWILIO_ACCOUNT_SID / TWILIO_FROM_NUMBER) missing; skipping text-back.');
  } else {
    if (!isTextableCaller(caller, env)) {
      outcome.callerTexted = { sent: false, skipped: true, error: 'Caller ID unavailable or not textable.' };
    } else if (!callerTextLimiter(caller).ok) {
      outcome.callerTexted = { sent: false, skipped: true, error: 'Already texted this caller in the last 24h.' };
    } else {
      outcome.callerTexted = await sendSms({ to: caller, body: missedCallTextBody(env) });
    }

    const owner = ownerAlertNumber(env);
    if (owner && ownerAlertLimiter('owner').ok) {
      const textedNote = outcome.callerTexted?.sent ? 'Auto-text sent.' : 'Caller was NOT texted.';
      outcome.ownerAlerted = await sendSms({
        to: owner,
        body: `Missed call from ${caller || 'unknown number'} (${dialStatus}). ${textedNote} Replies will be forwarded here.`,
      });
    }
  }

  const say = outcome.callerTexted?.sent
    ? '<Say voice="Polly.Joanna">Sorry we missed your call. We will text you right away so you can tell us what you need.</Say><Hangup/>'
    : '<Say voice="Polly.Joanna">Sorry we missed your call. Please try again shortly.</Say><Hangup/>';
  return { status: 200, body: twiml(say), outcome };
}

/** POST /api/twilio/sms: forward caller replies to the owner. Always returns empty TwiML. */
export async function handleIncomingSms(
  req: TwilioRequest,
  env: MissedCallEnv,
  sendSms: SendSms = sendAvaLeadSms,
): Promise<TwimlResponse & { forwarded?: AvaLeadSmsResult }> {
  const auth = authorize(req, env);
  if (!auth.ok) return auth.response;

  const from = clean(req.params.From);
  const body = clean(req.params.Body);
  const owner = ownerAlertNumber(env);
  const smsConfigured = Boolean(
    clean(env.TWILIO_ACCOUNT_SID) && clean(env.TWILIO_FROM_NUMBER) && owner,
  );

  // Do not echo the owner's own texts back to them (prevents loops).
  if (!smsConfigured || !body || !from || ownNumbers(env).has(from) || !smsForwardLimiter(from).ok) {
    return { status: 200, body: emptyTwiml() };
  }

  const forwarded = await sendSms({
    to: owner,
    body: `Text from ${from}: ${body}`.slice(0, 1600),
  });
  return { status: 200, body: emptyTwiml(), forwarded };
}

export function missedCallEnvFromProcess(): MissedCallEnv {
  return {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,
    MISSED_CALL_FORWARD_NUMBER: process.env.MISSED_CALL_FORWARD_NUMBER,
    MISSED_CALL_TEXT_TEMPLATE: process.env.MISSED_CALL_TEXT_TEMPLATE,
    AVA_LEAD_SMS_TO: process.env.AVA_LEAD_SMS_TO,
  };
}
