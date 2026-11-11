import { toE164 } from '@/lib/analytics/contact';

/**
 * Text confirmation to the caller Ava just booked. Transactional only, one message per booking.
 *
 * Off unless AVA_BOOKING_SMS_ENABLED is "1" or "true". It sends only from AVA_BOOKING_SMS_FROM (the toll-free
 * number, set after carrier verification is approved), never on demo calendars, and only when the caller said
 * yes to a text on the call (book_appointment `text_ok`). Twilio's toll-free opt-out handling enforces STOP.
 */
export type BookingSmsEnv = {
  AVA_BOOKING_SMS_ENABLED?: string;
  AVA_BOOKING_SMS_FROM?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
};

export type BookingSmsInput = {
  businessName: string;
  window: string;
  callerPhone: string | null | undefined;
  optIn: boolean;
  isDemo: boolean;
};

export type BookingSmsDecision =
  | { send: true; to: string; from: string; body: string }
  | { send: false; reason: 'disabled' | 'not_configured' | 'demo' | 'no_opt_in' | 'bad_phone' | 'same_number' };

export function bookingSmsEnabled(env: BookingSmsEnv) {
  const flag = String(env.AVA_BOOKING_SMS_ENABLED || '').trim().toLowerCase();
  return flag === '1' || flag === 'true';
}

function cleanBusinessName(name: string) {
  const plain = String(name || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return 'your service company';
  return plain.length > 40 ? `${plain.slice(0, 39).trimEnd()}…` : plain;
}

/** The message text. Kept short (about two SMS segments) and always carries STOP/HELP language. */
export function bookingSmsBody(businessName: string, window: string) {
  const business = cleanBusinessName(businessName);
  const when = String(window || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  return (
    `Ava for ${business}: you're booked for ${when}. The team will confirm before the visit. ` +
    'Reply HELP for help, STOP to opt out.'
  );
}

export function decideBookingSms(input: BookingSmsInput, env: BookingSmsEnv): BookingSmsDecision {
  if (!bookingSmsEnabled(env)) return { send: false, reason: 'disabled' };
  const from = toE164(env.AVA_BOOKING_SMS_FROM);
  if (!from || !env.TWILIO_ACCOUNT_SID?.trim() || !env.TWILIO_AUTH_TOKEN?.trim()) {
    return { send: false, reason: 'not_configured' };
  }
  if (input.isDemo) return { send: false, reason: 'demo' };
  if (input.optIn !== true) return { send: false, reason: 'no_opt_in' };
  const to = toE164(input.callerPhone);
  if (!to || !/^\+1\d{10}$/.test(to)) return { send: false, reason: 'bad_phone' };
  if (to === from) return { send: false, reason: 'same_number' };
  return { send: true, to, from, body: bookingSmsBody(input.businessName, input.window) };
}

export type SmsTransport = (opts: { to: string; from: string; body: string }) => Promise<{ sid?: string; error?: string }>;

/** Twilio REST transport. The `from` is explicit so this never falls back to another number. */
export function twilioTransport(env: BookingSmsEnv, fetchImpl: typeof fetch = fetch): SmsTransport {
  return async ({ to, from, body }) => {
    const sid = env.TWILIO_ACCOUNT_SID?.trim() || '';
    const token = env.TWILIO_AUTH_TOKEN?.trim() || '';
    const response = await fetchImpl(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      },
    );
    const result = (await response.json().catch(() => ({}))) as { sid?: string; message?: string };
    if (!response.ok) return { error: result.message || `Twilio returned ${response.status}` };
    return { sid: result.sid };
  };
}

/** Decide and (maybe) send. Returns a short status for the booking row: sent, failed, or skipped:<reason>. */
export async function sendBookingConfirmation(
  input: BookingSmsInput,
  env: BookingSmsEnv,
  transport: SmsTransport = twilioTransport(env),
): Promise<{ status: string; sid?: string }> {
  const decision = decideBookingSms(input, env);
  if (!decision.send) return { status: `skipped:${decision.reason}` };
  try {
    const result = await transport({ to: decision.to, from: decision.from, body: decision.body });
    if (result.error) {
      console.error('Ava booking text failed', result.error);
      return { status: 'failed' };
    }
    return { status: 'sent', sid: result.sid };
  } catch (error) {
    console.error('Ava booking text failed', error);
    return { status: 'failed' };
  }
}
