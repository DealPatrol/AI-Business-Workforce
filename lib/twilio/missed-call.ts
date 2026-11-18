import { sendAvaLeadSms, type AvaLeadSmsResult } from '../ava/sms';
import { validateTwilioSignature } from './signature';
import { createRateLimiter } from '../rate-limit';
import {
  MISSED_CALL_SCRIPT_VERSION,
  brandedCallerSms,
  missedCallConsentScript,
  ownerHasWrittenConsent,
  parseConsentAnswer,
  writeSmsConsent,
  type ConsentWriter,
} from '../sms/consent';

/**
 * Missed-Call Text-Back, consent first.
 *
 * Twilio number webhooks:
 *   Voice  "A call comes in"   -> POST /api/twilio/voice          (rings the owner; unchanged)
 *   (Dial action callback)     -> POST /api/twilio/voice/status   (missed: ask "press 1 or say yes")
 *   (Gather action)            -> POST /api/twilio/voice/consent  (record the answer, then text only on yes)
 *   Messaging "A message comes in" -> POST /api/twilio/sms
 *
 * No caller is texted without a recorded yes on that call. Owner alerts need written consent on file.
 *
 * Handlers are plain functions (no Next.js imports) so they can be unit tested.
 */

export const DEFAULT_MISSED_CALL_TEXT_TEMPLATE =
  "Executive Receptionist: Sorry we missed your call. Reply with what you need and we'll get right back to you. Msg & data rates may apply. Reply STOP to opt out, HELP for help.";
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
export const VOICE_CONSENT_PATH = '/api/twilio/voice/consent';
const GATHER_TIMEOUT_SECONDS = 6;

const MISSED_DIAL_STATUSES = new Set(['no-answer', 'busy', 'failed']);
const E164 = /^\+[1-9]\d{6,14}$/;

export type MissedCallEnv = {
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;
  MISSED_CALL_FORWARD_NUMBER?: string;
  MISSED_CALL_TEXT_TEMPLATE?: string;
  /** Business name spoken in the consent prompt and used in the text. Optional. */
  MISSED_CALL_BUSINESS_NAME?: string;
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

/** The caller text. Custom templates are wrapped so brand, rates and STOP/HELP are always present. */
export function missedCallTextBody(env: MissedCallEnv, calledNumber = ''): string {
  const template = clean(env.MISSED_CALL_TEXT_TEMPLATE);
  if (template) return brandedCallerSms(template);
  const business = clean(env.MISSED_CALL_BUSINESS_NAME);
  const callBack = isE164(calledNumber) ? ` or call us back at ${formatUsNumber(calledNumber)}` : '';
  if (!business && !callBack) return DEFAULT_MISSED_CALL_TEXT_TEMPLATE;
  return brandedCallerSms(
    `Executive Receptionist: Sorry we missed your call${business ? ` for ${business}` : ''}. Reply with what you need${callBack}. Msg & data rates may apply. Reply STOP to opt out, HELP for help.`,
  );
}

function formatUsNumber(e164: string) {
  const d = e164.replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : e164;
}

function siblingUrl(req: TwilioRequest, path: string) {
  const base = req.urls[req.urls.length - 1] || req.urls[0];
  return new URL(path, base).toString();
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
  /** True when the caller was asked "press 1 or say yes" for a text. */
  consentPrompted?: boolean;
  ownerAlerted?: AvaLeadSmsResult;
};

export type MissedCallDeps = {
  /** Written owner consent lookup (ava_onboardings.sms_consent). Defaults to Supabase. */
  ownerConsented?: (phone: string) => Promise<boolean>;
  /** Writes one sms_consents row. Defaults to Supabase. */
  recordConsent?: ConsentWriter;
};

function smsConfigured(env: MissedCallEnv) {
  return Boolean(clean(env.TWILIO_ACCOUNT_SID) && clean(env.TWILIO_AUTH_TOKEN) && clean(env.TWILIO_FROM_NUMBER));
}

const SAY = (text: string) => `<Say voice="Polly.Joanna">${escapeXml(text)}</Say>`;

/**
 * POST /api/twilio/voice/status: Dial action callback.
 * On a missed call, ask the caller for consent (press 1 / say yes). Nothing is texted to the caller here.
 * The owner gets a missed-call alert only if their written SMS consent is on file.
 */
export async function handleVoiceStatus(
  req: TwilioRequest,
  env: MissedCallEnv,
  sendSms: SendSms = sendAvaLeadSms,
  deps: MissedCallDeps = {},
): Promise<TwimlResponse & { outcome?: MissedCallOutcome }> {
  const auth = authorize(req, env);
  if (!auth.ok) return auth.response;

  const dialStatus = clean(req.params.DialCallStatus || req.params.CallStatus).toLowerCase();
  if (!MISSED_DIAL_STATUSES.has(dialStatus)) {
    // Answered/completed (or caller hung up first): nothing to do.
    return { status: 200, body: emptyTwiml(), outcome: { missed: false } };
  }

  const outcome: MissedCallOutcome = { missed: true, consentPrompted: false };
  const caller = clean(req.params.From);
  const configured = smsConfigured(env);

  if (!configured) {
    console.error('Twilio SMS env (TWILIO_ACCOUNT_SID / TWILIO_FROM_NUMBER) missing; no text-back offered.');
  } else {
    const owner = ownerAlertNumber(env);
    if (owner) {
      const ownerConsented = deps.ownerConsented ?? ownerHasWrittenConsent;
      if (!(await ownerConsented(owner))) {
        outcome.ownerAlerted = { sent: false, skipped: true, error: 'SMS not sent: no written owner SMS consent on file.' };
      } else if (ownerAlertLimiter('owner').ok) {
        outcome.ownerAlerted = await sendSms({
          to: owner,
          body: `Executive Receptionist: Missed call from ${caller || 'unknown number'} (${dialStatus}). The caller was offered a text-back. Replies will be forwarded here. Reply STOP to opt out, HELP for help.`,
        });
      }
    }
  }

  if (configured && isTextableCaller(caller, env)) {
    outcome.consentPrompted = true;
    const action = escapeXml(siblingUrl(req, VOICE_CONSENT_PATH));
    const prompt = missedCallConsentScript(env.MISSED_CALL_BUSINESS_NAME);
    const gather =
      `<Gather input="dtmf speech" numDigits="1" timeout="${GATHER_TIMEOUT_SECONDS}" speechTimeout="auto" ` +
      `hints="yes, no" action="${action}" method="POST" actionOnEmptyResult="true">${SAY(prompt)}</Gather>` +
      `${SAY('We will not text you. Please call back anytime. Goodbye.')}<Hangup/>`;
    return { status: 200, body: twiml(gather), outcome };
  }

  return { status: 200, body: twiml(`${SAY('Sorry we missed your call. Please try again shortly.')}<Hangup/>`), outcome };
}

export type ConsentOutcome = {
  answer: 'yes' | 'no' | null;
  recorded: boolean;
  callerTexted?: AvaLeadSmsResult;
};

/**
 * POST /api/twilio/voice/consent: Gather action.
 * Records the caller's answer first. Texts the caller only on a recorded yes.
 */
export async function handleConsentAnswer(
  req: TwilioRequest,
  env: MissedCallEnv,
  sendSms: SendSms = sendAvaLeadSms,
  deps: MissedCallDeps = {},
): Promise<TwimlResponse & { outcome?: ConsentOutcome }> {
  const auth = authorize(req, env);
  if (!auth.ok) return auth.response;

  const caller = clean(req.params.From);
  const digits = clean(req.params.Digits);
  const speech = clean(req.params.SpeechResult);
  const answer = parseConsentAnswer(digits || speech);
  const outcome: ConsentOutcome = { answer, recorded: false };
  const goodbyeNo = `${SAY("No problem. We won't text you. Please call back anytime. Goodbye.")}<Hangup/>`;

  if (!answer) return { status: 200, body: twiml(goodbyeNo), outcome };

  const record = deps.recordConsent ?? writeSmsConsent;
  const business = clean(env.MISSED_CALL_BUSINESS_NAME) || null;
  const saved = await record({
    phone: caller || null,
    method: digits ? 'keypad' : 'verbal',
    answer,
    script_version: MISSED_CALL_SCRIPT_VERSION,
    consent_text: missedCallConsentScript(business),
    call_sid: clean(req.params.CallSid) || null,
    business_name: business,
    source: 'twilio_missed_call',
  });
  outcome.recorded = saved.ok;
  if (!saved.ok) console.error('Missed-call SMS consent was not recorded; not texting.', saved.error);

  if (answer === 'no') return { status: 200, body: twiml(goodbyeNo), outcome };

  if (!saved.ok || saved.fresh === false || !clean(req.params.CallSid) || !smsConfigured(env) || !isTextableCaller(caller, env)) {
    outcome.callerTexted = { sent: false, skipped: true, error: 'Consent not recorded or caller not textable.' };
    return { status: 200, body: twiml(`${SAY('Sorry, we could not set up the text. Please call back anytime. Goodbye.')}<Hangup/>`), outcome };
  }
  if (!callerTextLimiter(caller).ok) {
    outcome.callerTexted = { sent: false, skipped: true, error: 'Already texted this caller in the last 24h.' };
    return { status: 200, body: twiml(`${SAY('We already texted you today. Please reply to that text. Goodbye.')}<Hangup/>`), outcome };
  }

  outcome.callerTexted = await sendSms({ to: caller, body: missedCallTextBody(env, clean(req.params.To)) });
  const say = outcome.callerTexted.sent
    ? "Thanks. We'll text you now. Reply STOP anytime to opt out. Goodbye."
    : 'Sorry, the text did not go through. Please call back anytime. Goodbye.';
  return { status: 200, body: twiml(`${SAY(say)}<Hangup/>`), outcome };
}

/** POST /api/twilio/sms: forward caller replies to the owner. Always returns empty TwiML. */
export async function handleIncomingSms(
  req: TwilioRequest,
  env: MissedCallEnv,
  sendSms: SendSms = sendAvaLeadSms,
  deps: MissedCallDeps = {},
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

  // Forwards go to the owner's phone, so they need the owner's written consent too.
  if (!(await (deps.ownerConsented ?? ownerHasWrittenConsent)(owner))) {
    return { status: 200, body: emptyTwiml(), forwarded: { sent: false, skipped: true, error: 'SMS not sent: no written owner SMS consent on file.' } };
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
    MISSED_CALL_BUSINESS_NAME: process.env.MISSED_CALL_BUSINESS_NAME,
    AVA_LEAD_SMS_TO: process.env.AVA_LEAD_SMS_TO,
  };
}
