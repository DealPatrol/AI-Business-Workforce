/**
 * Warm transfer: Ava briefs the person who answers, then connects the caller.
 *
 * Two delivery modes:
 * - 'warm'     ElevenLabs' native Twilio warm conference transfer. The person who picks up hears Ava's
 *              one-sentence briefing (agent_message), then the caller is connected. Up to 3 numbers.
 * - 'screened' Ava calls prepare_transfer first, then transfers to our screening line
 *              (AVA_TRANSFER_SCREEN_NUMBER, a Twilio number pointed at /api/twilio/transfer/screen).
 *              Each owner number hears the briefing and must press 1 to take the caller, so an owner's
 *              voicemail can never swallow the call. If nobody presses 1, the caller hears that the team
 *              was paged and a callback is booked.
 */

export const MAX_TRANSFER_NUMBERS = 3;

export type TransferReason = 'emergency' | 'person' | 'billing' | 'custom';

export type TransferRule = {
  /** Who answers, e.g. "On-call tech" or "Office". Spoken to nobody; used in the prompt and the desk. */
  label: string;
  /** E.164 US number, e.g. +12565550100. */
  phone: string;
  reason: TransferReason;
  /** Only for reason 'custom': when Ava should use this number. */
  when?: string;
};

export type TransferMode = 'warm' | 'screened';

const E164_US = /^\+1[2-9]\d{2}[2-9]\d{6}$/;

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

/** Digits-only or formatted US numbers to E.164. Returns '' when it is not a valid US number. */
export function toUsE164(raw: unknown) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (ten.length !== 10) return '';
  const e164 = `+1${ten}`;
  return E164_US.test(e164) ? e164 : '';
}

const REASONS: TransferReason[] = ['emergency', 'person', 'billing', 'custom'];

/**
 * Up to three clean transfer rules from onboarding input. Accepts the legacy single `transferNumber`
 * (treated as "emergencies and anyone asking for a person"). Drops invalid or duplicate numbers.
 */
export function normalizeTransferRules(input: { transferRules?: unknown; transferNumber?: string | null }): TransferRule[] {
  const out: TransferRule[] = [];
  const seen = new Set<string>();
  const raw = Array.isArray(input.transferRules) ? input.transferRules : [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const phone = toUsE164(row.phone);
    if (!phone || seen.has(phone)) continue;
    const reason = REASONS.includes(row.reason as TransferReason) ? (row.reason as TransferReason) : 'person';
    const when = clean(row.when, 200);
    if (reason === 'custom' && !when) continue;
    seen.add(phone);
    out.push({ label: clean(row.label, 40) || defaultLabel(reason), phone, reason, ...(reason === 'custom' ? { when } : {}) });
    if (out.length >= MAX_TRANSFER_NUMBERS) return out;
  }
  if (out.length === 0) {
    const legacy = toUsE164(input.transferNumber);
    if (legacy) out.push({ label: 'Owner', phone: legacy, reason: 'person' });
  }
  return out;
}

function defaultLabel(reason: TransferReason) {
  return reason === 'emergency' ? 'On-call tech' : reason === 'billing' ? 'Billing' : reason === 'person' ? 'Office' : 'Team';
}

/** The plain-English condition ElevenLabs shows the model for one rule. */
export function transferCondition(rule: TransferRule, onlyRule: boolean) {
  if (rule.reason === 'custom') return rule.when || 'The caller needs this team member.';
  if (onlyRule) {
    return 'The caller has an emergency under the urgent-call rules, or clearly asks to speak to a person.';
  }
  if (rule.reason === 'emergency') return 'The caller has an emergency under the urgent-call rules.';
  if (rule.reason === 'billing') return 'The caller has a billing question or dispute and wants a person.';
  return 'The caller clearly asks to speak to a person, the owner, or a manager.';
}

/**
 * The built-in transfer_to_number tool. Uses per-provider transfer rules (Twilio warm conference transfer)
 * so the person who answers hears Ava's briefing first. In 'screened' mode there is one rule that points at
 * the screening line, which rings the owner numbers itself.
 */
export function transferToNumberTool(rules: TransferRule[], opts: { mode?: TransferMode; screenNumber?: string } = {}) {
  if (rules.length === 0) return null;
  const mode: TransferMode = opts.mode === 'screened' && toUsE164(opts.screenNumber) ? 'screened' : 'warm';
  const transferRules =
    mode === 'screened'
      ? [
          {
            condition:
              'The caller has an emergency under the urgent-call rules, or clearly asks to speak to a person, and prepare_transfer has returned ok.',
            provider_configs: [
              {
                type: 'twilio',
                // Blind keeps the caller's own number as caller ID, which is how the screen finds the briefing.
                config: { type: 'twilio_cold_blind_transfer', transfer_destination: { type: 'phone', destination: toUsE164(opts.screenNumber) } },
              },
            ],
          },
        ]
      : rules.map((rule) => ({
          condition: transferCondition(rule, rules.length === 1),
          provider_configs: [
            {
              type: 'twilio',
              config: { type: 'twilio_warm_conference_transfer', transfer_destination: { type: 'phone', destination: rule.phone } },
            },
          ],
        }));
  return {
    type: 'system',
    name: 'transfer_to_number',
    description:
      'Connect the caller to a person on the business team. Always write agent_message as the one-sentence briefing described in LIVE TRANSFER, and client_message as a short "please hold" line.',
    params: {
      system_tool_type: 'transfer_to_number',
      enable_client_message: true,
      transfers: [],
      transfer_rules: transferRules,
    },
  };
}

/**
 * Callers hate phone AIs that won't let them reach a person. Ava agrees on the first ask, collects only
 * name, number and reason, reads them back in one sentence, and transfers as soon as the caller says yes.
 * Tested on the ElevenLabs TEST copy agent_6101m88bvq4beqvr4amvrm9xb225 (Nov 24, 2026).
 */
export const FIRST_ASK_RULES = `Transfer on the FIRST request for a person. Do not ask why they want a person before agreeing, do not offer to help them yourself instead, and never make them ask twice. Say something like "Sure, I'll get you to someone. Can I get your name first?"
Before an office transfer you need only three things: the caller's name, best callback number, and a few words on what it's about. Ask one short question for each, skipping anything they already gave. If they refuse one, skip it and transfer anyway. For an emergency transfer, also get the address and the problem.
Then read it all back in ONE sentence and wait for a yes: "Just so the team has it: [name], callback [number digit by digit], calling about [reason]. Is that right?" If they correct something, fix it and confirm once more. As soon as they say yes, call transfer_to_number in that same turn.`;

/** Prompt section that makes the transfer warm, and says exactly what to do when nobody takes the call. */
export function liveTransferPromptSection(rules: TransferRule[], opts: { mode?: TransferMode; paging?: boolean; callbacks?: boolean } = {}) {
  if (rules.length === 0) return '';
  const who = rules
    // Labels only: the number lives in the tool config, so Ava can never read the owner's phone to a caller.
    .map((r) => `- ${r.label}: ${transferCondition(r, rules.length === 1)}`)
    .join('\n');
  const screened = opts.mode === 'screened';
  const fallback = [
    'If transfer_to_number returns status success, the caller has been handed off: do not page, do not book a callback, and do not say it failed.',
    'If the transfer fails, nobody answers, or the tool says the call was not accepted, come back to the caller, say honestly that nobody could pick up right now, apologize briefly, tell them their name, number and message have been passed to the team, and do not try the same number again.',
    opts.paging
      ? 'Only if it was an emergency transfer, call page_on_call (reason transfer_unanswered) and tell the caller you have paged the on-call team only after it says Paged. Never promise an arrival time. For a non-emergency transfer (a person, the owner, billing, warranty or a complaint) never call page_on_call.'
      : '',
    opts.callbacks
      ? 'Then offer a callback: call book_callback, offer the window it returns, and read the held window back.'
      : 'Then confirm their name and number and say the team will call back as soon as they can.',
  ]
    .filter(Boolean)
    .join(' ');
  return `LIVE TRANSFER (warm: brief the person first)
Numbers you may connect to:
${who}
${FIRST_ASK_RULES}${
    screened
      ? '\nAfter the yes, first call prepare_transfer with those details and a one-sentence summary. Only if it returns ok, call transfer_to_number.'
      : ''
  }
When you call transfer_to_number:
- client_message: one short line to the caller, like "Thanks. Please hold for just a moment while I get someone on the line."
- agent_message: ONE sentence for the person who answers, in this order: "Ava from Executive Receptionist with a transferred call: [caller name], callback [number read as digits], calling about [reason or issue][, at address for service calls]." For an emergency, start the reason with "emergency" and add one short fact that matters (for example "elderly parent at home" or "water on the floor"). No greetings, no filler, never more than 40 words.
${fallback}
Transfer only when the caller wants to talk to someone right now or has an emergency. If they ask to be called back later, do not transfer${opts.callbacks ? ': use book_callback' : ''}.
Never say you are transferring unless you are calling transfer_to_number right now. Never transfer spam, sales calls or wrong numbers.`;
}

/** The whisper the screening line reads to the person who answers (also used in the page email). */
export function briefingSentence(input: {
  businessName: string;
  callerName?: string | null;
  callerPhone?: string | null;
  address?: string | null;
  issue?: string | null;
  urgent?: boolean;
}) {
  const parts = [
    `Ava from Executive Receptionist has a ${input.urgent ? 'priority' : ''} caller for ${clean(input.businessName, 60) || 'your business'}`.replace(
      /a {2}/,
      'a ',
    ),
    clean(input.callerName, 60) ? `${clean(input.callerName, 60)}` : 'the caller did not give a name',
    clean(input.issue, 160) ? `about ${clean(input.issue, 160)}` : '',
    clean(input.address, 120) ? `at ${clean(input.address, 120)}` : '',
    clean(input.callerPhone, 20) ? `callback ${spokenDigits(input.callerPhone || '')}` : '',
  ].filter(Boolean);
  return `${parts.join(', ')}.`;
}

/** "2565550100" -> "2 5 6, 5 5 5, 0 1 0 0" so text-to-speech reads it as digits. */
export function spokenDigits(raw: string) {
  const d = String(raw).replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length !== 10) return ten.split('').join(' ');
  return `${ten.slice(0, 3).split('').join(' ')}, ${ten.slice(3, 6).split('').join(' ')}, ${ten.slice(6).split('').join(' ')}`;
}
