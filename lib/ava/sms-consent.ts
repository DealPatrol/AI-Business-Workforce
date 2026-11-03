/**
 * SMS consent for owner lead-alert texts.
 *
 * Texts go out only when the owner ticked the optional checkbox on the onboarding form
 * (ava_onboardings.sms_consent = true) AND there is a staff phone number to text.
 * Email alerts never depend on this.
 */

/** Exact wording shown next to the checkbox and stored with the consent. Keep in sync with the 10DLC packet message_flow. */
export const SMS_CONSENT_TEXT =
  'Text me new-lead alerts from Executive Receptionist at this number. Message frequency varies with call volume. Msg & data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase. See our Privacy Policy and Terms.';

/** Form checkbox value: 'on' (browser default), 'true', '1', or a real boolean. Anything else is no consent. */
export function parseSmsConsent(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value !== 'string') return false;
  return ['on', 'true', '1', 'yes'].includes(value.trim().toLowerCase());
}

export type OwnerSmsDecision =
  | { send: true; to: string }
  | { send: false; reason: 'no_consent' | 'no_phone' };

/** Strict gate: consent must be exactly true, and a phone number must be on file. */
export function decideOwnerSms(input: {
  smsConsent: boolean | null | undefined;
  phone: string | null | undefined;
}): OwnerSmsDecision {
  if (input.smsConsent !== true) return { send: false, reason: 'no_consent' };
  const to = (input.phone || '').trim();
  if (!to) return { send: false, reason: 'no_phone' };
  return { send: true, to };
}

/**
 * Texts to the operator's own number (AVA_LEAD_SMS_TO), such as demo-lead and sales-qualify alerts,
 * have no customer row to hold consent. They are off unless the operator opts in explicitly.
 */
export function operatorSmsConsented(env: Record<string, string | undefined> = process.env): boolean {
  return (env.AVA_OPERATOR_SMS_CONSENT || '').trim().toLowerCase() === 'true';
}

export const SMS_SKIPPED_NO_CONSENT = {
  sent: false,
  skipped: true,
  error: 'SMS not sent: no SMS consent on file.',
} as const;
