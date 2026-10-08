import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { normalizeEmail, parseStaffContacts, toE164 } from '@/lib/analytics/contact';
import { isPayingAvaSubscriptionStatus } from '@/lib/ava/post-call-gate';

export const DESTINATION_EDIT_TTL_SECONDS = 30 * 60;
const PURPOSE = 'ava-notify-destination';
const CLOCK_SKEW_SECONDS = 60;

export class DestinationLockedError extends Error {
  readonly code = 'destination_locked' as const;

  constructor(message: string) {
    super(message);
    this.name = 'DestinationLockedError';
  }
}

export type NotificationDestinations = {
  email: string;
  phone: string;
};

export function notificationDestinationsFromParts(input: {
  staffEmail?: string | null;
  staffPhone?: string | null;
  staffContact?: string | null;
}): NotificationDestinations {
  const parsed = parseStaffContacts(
    [input.staffPhone, input.staffEmail, input.staffContact].filter(Boolean).join(' '),
  );
  return {
    email: normalizeEmail(input.staffEmail) || parsed.email,
    phone: toE164(input.staffPhone) || parsed.phone,
  };
}

export function notificationDestinationsChanged(
  current: NotificationDestinations,
  next: NotificationDestinations,
) {
  return current.email !== next.email || current.phone !== next.phone;
}

/** HMAC key for destination-edit links. Optional override, otherwise the Stripe secret already on the server. */
export function destinationEditSecret() {
  return (
    process.env.AVA_DESTINATION_EDIT_SECRET?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim() ||
    ''
  );
}

type TokenPayload = {
  p: string;
  sid: string;
  eh: string;
  iat: number;
  exp: number;
};

function emailHash(email: string) {
  return createHash('sha256').update(normalizeEmail(email), 'utf8').digest('hex');
}

function encode(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function decode(value: string) {
  return Buffer.from(value, 'base64url');
}

export function signDestinationEditToken(input: {
  sessionId: string;
  email: string;
  secret: string;
  nowSeconds?: number;
}) {
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    p: PURPOSE,
    sid: input.sessionId,
    eh: emailHash(input.email),
    iat: now,
    exp: now + DESTINATION_EDIT_TTL_SECONDS,
  };
  const body = encode(JSON.stringify(payload));
  const signature = createHmac('sha256', input.secret).update(body, 'utf8').digest();
  return `v1.${body}.${encode(signature)}`;
}

export function verifyDestinationEditToken(
  token: string,
  input: { sessionId: string; email: string; secret: string; nowSeconds?: number },
) {
  if (!input.secret || !input.sessionId || !normalizeEmail(input.email) || !token) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;
  const body = parts[1] || '';
  const signaturePart = parts[2] || '';
  if (!body || !signaturePart) return false;

  const expected = createHmac('sha256', input.secret).update(body, 'utf8').digest();
  const actual = decode(signaturePart);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(decode(body).toString('utf8')) as TokenPayload;
  } catch {
    return false;
  }

  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (payload.p !== PURPOSE || payload.sid !== input.sessionId) return false;
  if (payload.eh !== emailHash(input.email)) return false;
  if (!Number.isFinite(payload.iat) || !Number.isFinite(payload.exp)) return false;
  if (payload.exp !== payload.iat + DESTINATION_EDIT_TTL_SECONDS) return false;
  if (payload.iat > now + CLOCK_SKEW_SECONDS) return false;
  if (now > payload.exp + CLOCK_SKEW_SECONDS) return false;
  return true;
}

export function canIssueDestinationEdit(input: {
  outcome: string;
  recognizedAvaCheckout: boolean;
  subscriptionStatus: string;
  email: string;
}) {
  return (
    input.outcome === 'ok' &&
    input.recognizedAvaCheckout &&
    isPayingAvaSubscriptionStatus(input.subscriptionStatus) &&
    Boolean(normalizeEmail(input.email))
  );
}
