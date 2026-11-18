import { timingSafeEqual } from 'node:crypto';
import { toE164 } from '@/lib/analytics/contact';
import {
  AVA_VERBAL_SCRIPT_VERSION,
  avaVerbalScript,
  parseConsentAnswer,
  verbalConfirmationSms,
  writeSmsConsent,
  type ConsentWriter,
} from '@/lib/sms/consent';

/**
 * ElevenLabs webhook tool `record_sms_consent`.
 * Ava calls it right after the caller answers the VERBAL SMS CONSENT script (yes or no).
 * The answer is written to sms_consents before anything else. A confirmation text goes out only on a
 * recorded yes, only for a real customer agent, and only once caller texting is switched on.
 */

export const CONSENT_TOOL_SECRET_HEADER = 'x-ava-consent-secret';
export const CONSENT_TOOL_PATH = '/api/ava/sms-consent';

export const SAY_YES_WITH_TEXT = "Thanks. I'll send a short text now to confirm. If you ever want to stop, just reply STOP.";
export const SAY_YES_NO_TEXT = "Thanks, I've noted that. If you ever want to stop texts, just reply STOP.";
export const SAY_NO = "No problem. I won't text you. I can still take your message.";

export type ConsentToolEnv = {
  AVA_CONSENT_TOOL_SECRET?: string;
  AVA_BOOKING_SMS_ENABLED?: string;
  AVA_BOOKING_SMS_FROM?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
};

/** Live demo agents (no onboarding row): name the business they voice, never text. */
const DEMO_AGENT_BUSINESS: Record<string, string> = {
  agent_7401m6jkzsstf0evm2www8r46kj6: 'Porchlight Heating & Air',
  agent_9501m56myx6xfmaty2v1dxn56mve: 'Front Porch Heating & Air',
};

export type ConsentAgentMatch = { onboardingId: string; businessName: string } | null;

export type ConsentToolDeps = {
  record?: ConsentWriter;
  findAgent?: (agentId: string) => Promise<ConsentAgentMatch>;
  sendText?: (opts: { to: string; from: string; body: string }) => Promise<{ sid?: string; error?: string }>;
};

export function consentSecretMatches(provided: string, env: ConsentToolEnv) {
  const expected = (env.AVA_CONSENT_TOOL_SECRET || '').trim();
  const got = (provided || '').trim();
  if (!expected || !got || expected.length !== got.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(got));
}

function textingOn(env: ConsentToolEnv) {
  const flag = String(env.AVA_BOOKING_SMS_ENABLED || '').trim().toLowerCase();
  return (
    (flag === '1' || flag === 'true') &&
    Boolean(toE164(env.AVA_BOOKING_SMS_FROM)) &&
    Boolean(env.TWILIO_ACCOUNT_SID?.trim()) &&
    Boolean(env.TWILIO_AUTH_TOKEN?.trim())
  );
}

function str(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export type ConsentToolResult = {
  recorded: boolean;
  answer: 'yes' | 'no' | null;
  texted?: boolean;
  say: string;
  message: string;
};

export async function handleConsentTool(
  body: Record<string, unknown>,
  env: ConsentToolEnv,
  deps: ConsentToolDeps = {},
): Promise<ConsentToolResult> {
  const answer = parseConsentAnswer(body.answer);
  if (!answer) {
    return {
      recorded: false,
      answer: null,
      say: '',
      message: 'The answer was not a clear yes or no. Ask once more: "Would you like to receive these texts? Please say yes or no." Treat anything unclear as no.',
    };
  }

  const agentId = str(body.agent_id, 120);
  const conversationId = str(body.conversation_id, 120);
  const phone = toE164(str(body.caller_phone, 40)) || null;
  const match = agentId && deps.findAgent ? await deps.findAgent(agentId).catch(() => null) : null;
  const businessName = match?.businessName || DEMO_AGENT_BUSINESS[agentId] || null;

  const saved = await (deps.record ?? writeSmsConsent)({
    phone,
    method: 'verbal',
    answer,
    script_version: AVA_VERBAL_SCRIPT_VERSION,
    consent_text: avaVerbalScript(businessName),
    call_sid: str(body.call_sid, 80) || null,
    conversation_id: conversationId || null,
    agent_id: agentId || null,
    onboarding_id: match?.onboardingId || null,
    business_name: businessName,
    source: 'ava_record_sms_consent',
  });

  if (!saved.ok) console.error('Ava verbal SMS consent was not recorded.', saved.error);

  if (answer === 'no') {
    return { recorded: saved.ok, answer, say: SAY_NO, message: `Say: "${SAY_NO}" Then continue the call. Do not mention texts again.` };
  }

  // Yes. Text only when the yes is on record, the caller has a real US number, this is a customer
  // agent (not a demo), and caller texting is switched on for the verified toll-free number.
  const from = toE164(env.AVA_BOOKING_SMS_FROM);
  const canText = saved.ok && saved.fresh !== false && Boolean(conversationId) && Boolean(match) && Boolean(phone && /^\+1\d{10}$/.test(phone)) && textingOn(env) && phone !== from;
  let texted = false;
  if (canText && deps.sendText && phone) {
    try {
      const result = await deps.sendText({ to: phone, from, body: verbalConfirmationSms(businessName) });
      texted = !result.error;
      if (result.error) console.error('Verbal-consent confirmation text failed', result.error);
    } catch (error) {
      console.error('Verbal-consent confirmation text failed', error);
    }
  }
  const say = texted ? SAY_YES_WITH_TEXT : SAY_YES_NO_TEXT;
  return { recorded: saved.ok, answer, texted, say, message: `Say: "${say}" Then continue the call.` };
}

/** Real customer agent lookup: an onboarding row that owns this ElevenLabs agent id. */
export async function findOnboardingForAgent(agentId: string): Promise<ConsentAgentMatch> {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_onboardings')
    .select('id, business_name')
    .eq('elevenlabs_agent_id', agentId)
    .limit(1);
  if (error || !Array.isArray(data) || !data.length) return null;
  const row = data[0] as { id: string; business_name: string | null };
  return { onboardingId: row.id, businessName: row.business_name || '' };
}

/** The ElevenLabs webhook tool definition (one shared workspace tool). */
export function consentToolConfig(baseUrl: string, secret: string) {
  return {
    tool_config: {
      type: 'webhook',
      name: 'record_sms_consent',
      description:
        "Record the caller's answer to the VERBAL SMS CONSENT script. Call it once, right after the caller clearly says yes or no to receiving texts, before you promise or send any text. Then say the 'say' line it returns.",
      response_timeout_secs: 10,
      api_schema: {
        url: `${baseUrl}${CONSENT_TOOL_PATH}`,
        method: 'POST',
        request_headers: { [CONSENT_TOOL_SECRET_HEADER]: secret, 'Content-Type': 'application/json' },
        request_body_schema: {
          type: 'object',
          required: ['answer'],
          description: "The caller's answer to the SMS consent script.",
          properties: {
            answer: { type: 'string', enum: ['yes', 'no'], description: 'yes only if the caller clearly said yes to the texts; otherwise no.' },
            caller_phone: { type: 'string', dynamic_variable: 'system__caller_id', description: '' },
            conversation_id: { type: 'string', dynamic_variable: 'system__conversation_id', description: '' },
            agent_id: { type: 'string', dynamic_variable: 'system__agent_id', description: '' },
          },
        },
      },
    },
  };
}
