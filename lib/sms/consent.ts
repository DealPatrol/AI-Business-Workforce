/**
 * SMS consent records (public.sms_consents) and the caller-text rules every outgoing caller text follows.
 *
 * What is published on /sms-consent must match this file. Change both together.
 *  - Ava (ElevenLabs) asks the verbal script and logs the answer with the record_sms_consent tool.
 *  - The missed-call line asks "press 1 or say yes" and logs the answer before any text.
 *  - The website setup form stores written owner consent on ava_onboardings and also logs a web_form row here.
 * Rows are append-only: a later "no" or a STOP never deletes an earlier record.
 */

export type ConsentMethod = 'verbal' | 'keypad' | 'web_form';
export type ConsentAnswer = 'yes' | 'no';

export const BRAND = 'Executive Receptionist';
export const CALLER_SMS_DISCLOSURE = 'Msg & data rates may apply. Reply STOP to opt out, HELP for help.';

/** Script versions stored with each record. Bump when the spoken words change. */
export const AVA_VERBAL_SCRIPT_VERSION = 'ava-verbal-v1';
export const MISSED_CALL_SCRIPT_VERSION = 'missed-call-v1';
export const WEB_FORM_SCRIPT_VERSION = 'web-form-v1';

/** Ava's verbal script. [Business] is replaced with the client business name. Published on /sms-consent. */
export const AVA_VERBAL_CONSENT_SCRIPT =
  "This is Ava with Executive Receptionist, helping [Business]. Would you like me to text you at the number you're calling from about this call? I would only text you things like a missed-call callback if we get disconnected, or a booking confirmation if we set an appointment. At most a few texts about this visit. Message and data rates may apply. You can reply STOP anytime to opt out, or HELP for help. This is optional — I can still take your message if you'd rather not get texts. Would you like to receive these texts? Please say yes or no.";

export function avaVerbalScript(businessName?: string | null) {
  return AVA_VERBAL_CONSENT_SCRIPT.replace('[Business]', cleanName(businessName) || '[Business]');
}

/** Prompt played on the missed-call line after nobody picked up. Published on /sms-consent. */
export function missedCallConsentScript(businessName?: string | null) {
  const business = cleanName(businessName);
  return (
    `Sorry we missed your call${business ? ` to ${business}` : ''}. This is ${BRAND}. ` +
    'Would you like one text message about this call, so you can reply with what you need? ' +
    'Message and data rates may apply. Reply STOP to opt out, or HELP for help. ' +
    'Press 1 or say yes to get the text. Press 2 or say no, or just hang up, and we will not text you.'
  );
}

function cleanName(value?: string | null) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

/**
 * Every text to a caller carries the brand, the rates line, and STOP/HELP.
 * Custom templates are wrapped, never trusted to include them.
 */
export function brandedCallerSms(core: string) {
  let body = String(core || '').replace(/\s+/g, ' ').trim();
  if (!body.includes(BRAND)) body = `${BRAND}: ${body}`;
  const parts: string[] = [];
  if (!body.includes('Msg & data rates may apply')) parts.push('Msg & data rates may apply.');
  if (!body.includes('Reply STOP to opt out, HELP for help')) parts.push('Reply STOP to opt out, HELP for help.');
  const suffix = parts.length ? ` ${parts.join(' ')}` : '';
  // Trim the message itself, never the required disclosures.
  if (body.length + suffix.length > 600) {
    body = `${BRAND}: ${body.replace(/^Executive Receptionist:\s*/, '').replace(/Msg & data rates may apply\.?|Reply STOP to opt out, HELP for help\.?/g, '').trim()}`;
    const keep = 600 - ' Msg & data rates may apply. Reply STOP to opt out, HELP for help.'.length;
    return `${body.slice(0, keep).trim()} Msg & data rates may apply. Reply STOP to opt out, HELP for help.`;
  }
  return `${body}${suffix}`;
}

export function isCompliantCallerSms(body: string) {
  return (
    body.includes(BRAND) &&
    body.includes('Msg & data rates may apply') &&
    body.includes('Reply STOP to opt out, HELP for help')
  );
}

/** The confirmation sent right after a verbal yes. */
export function verbalConfirmationSms(businessName?: string | null) {
  const business = cleanName(businessName) || 'the business you called';
  return brandedCallerSms(
    `${BRAND}: You're opted in for texts about your call to ${business}, like a missed-call callback or booking confirmation. Msg freq: a few texts per visit at most. ${CALLER_SMS_DISCLOSURE}`,
  );
}

/** yes / no from a keypad digit, a spoken phrase, a boolean, or a tool argument. null when unclear. */
export function parseConsentAnswer(value: unknown): ConsentAnswer | null {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  const text = String(value ?? '').trim().toLowerCase().replace(/[.!?,]/g, '');
  if (!text) return null;
  if (text === '1') return 'yes';
  if (text === '2') return 'no';
  if (/\b(no|nope|don't|dont|do not|not|nah|no thanks|no thank you)\b/.test(text)) return 'no';
  // Only an explicit yes counts. "Okay", "sure" or "go ahead" are treated as unclear (no text).
  if (/^(yes|yeah|yep|yup|sí|si|true)( please| that's fine| thanks| thank you)?$/.test(text)) return 'yes';
  return null;
}

export type SmsConsentRecord = {
  phone: string | null;
  method: ConsentMethod;
  answer: ConsentAnswer;
  script_version: string;
  consent_text: string;
  call_sid?: string | null;
  conversation_id?: string | null;
  agent_id?: string | null;
  onboarding_id?: string | null;
  business_name?: string | null;
  source: string;
  ip?: string | null;
  event_key?: string | null;
};

export type ConsentWriter = (record: SmsConsentRecord) => Promise<{ ok: true; id: string; fresh?: boolean } | { ok: false; error: string }>;

/** Supabase writer. Uses the server secret; the table has RLS on with no public policies. */
export const writeSmsConsent: ConsentWriter = async (record) => {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();
    const ref = record.conversation_id || record.call_sid;
    const eventKey = record.event_key || (ref ? `${record.source}:${ref}:${record.phone || ''}:${record.answer}` : null);
    const payload = { ...record, event_key: eventKey };
    const { data, error } = eventKey
      ? await supabase.from('sms_consents').upsert(payload, { onConflict: 'event_key', ignoreDuplicates: true }).select('id').maybeSingle()
      : await supabase.from('sms_consents').insert(payload).select('id').single();
    if (error) return { ok: false, error: error.message };
    if (!data && eventKey) {
      const prior = await supabase.from('sms_consents').select('id').eq('event_key', eventKey).single();
      if (prior.error || !prior.data) return { ok: false, error: prior.error?.message || 'No prior row returned.' };
      return { ok: true, id: String(prior.data.id), fresh: false };
    }
    if (!data) return { ok: false, error: 'No row returned.' };
    return { ok: true, id: String((data as { id: string }).id), fresh: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Consent write failed.' };
  }
};

/**
 * Written owner consent: true only when an ava_onboardings row with this staff phone has sms_consent = true.
 * Used before owner lead alerts and missed-call alerts go to a phone.
 */
export async function ownerHasWrittenConsent(phone: string): Promise<boolean> {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return false;
  const ten = digits.slice(-10);
  const variants = Array.from(new Set([phone.trim(), `+1${ten}`, `1${ten}`, ten]));
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('ava_onboardings')
      .select('id')
      .eq('sms_consent', true)
      .in('staff_phone', variants)
      .limit(1);
    if (error) {
      console.error('Owner SMS consent lookup failed; not texting.', error.message);
      return false;
    }
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error('Owner SMS consent lookup failed; not texting.', error);
    return false;
  }
}

/** Booking SMS must use a yes already recorded by record_sms_consent on this exact conversation/phone. */
export async function callerHasVerbalConsent(phone: string, conversationId?: string | null): Promise<boolean> {
  if (!conversationId || !/^\+1\d{10}$/.test(phone)) return false;
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('sms_consents')
      .select('answer')
      .eq('phone', phone)
      .eq('conversation_id', conversationId)
      .eq('source', 'ava_record_sms_consent')
      .order('created_at', { ascending: false })
      .limit(1);
    return !error && Array.isArray(data) && data[0]?.answer === 'yes';
  } catch {
    return false;
  }
}
