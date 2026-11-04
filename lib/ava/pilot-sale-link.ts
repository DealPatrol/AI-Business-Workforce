import { createHmac, timingSafeEqual } from 'crypto';

/** HMAC key for "Mark as booked job" links. Must be added to the environment; there is no fallback. */
export const PILOT_SALE_LINK_SECRET_ENV = 'AVA_SALE_LINK_SECRET';
export const PILOT_SALE_LINK_TTL_SECONDS = 90 * 24 * 60 * 60;
const PURPOSE = 'ava-pilot-sale';
const CLOCK_SKEW_SECONDS = 60;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function pilotSaleLinkSecret() {
  return process.env[PILOT_SALE_LINK_SECRET_ENV]?.trim() || '';
}

type Payload = { p: string; lid: string; iat: number; exp: number };

function encode(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function signBody(body: string, secret: string) {
  return createHmac('sha256', secret).update(body, 'utf8').digest();
}

export function signPilotSaleToken(input: {
  leadId: string;
  secret: string;
  nowSeconds?: number;
  ttlSeconds?: number;
}) {
  if (!input.secret) throw new Error(`${PILOT_SALE_LINK_SECRET_ENV} is not configured.`);
  if (!UUID_PATTERN.test(input.leadId)) throw new Error('A lead id (uuid) is required.');
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const payload: Payload = {
    p: PURPOSE,
    lid: input.leadId,
    iat: now,
    exp: now + (input.ttlSeconds ?? PILOT_SALE_LINK_TTL_SECONDS),
  };
  const body = encode(JSON.stringify(payload));
  return `v1.${body}.${encode(signBody(body, input.secret))}`;
}

export type PilotSaleTokenResult =
  | { ok: true; leadId: string }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' | 'wrong_purpose' | 'no_secret' };

export function verifyPilotSaleToken(input: {
  token: string;
  secret: string;
  nowSeconds?: number;
}): PilotSaleTokenResult {
  if (!input.secret) return { ok: false, reason: 'no_secret' };
  const parts = (input.token || '').split('.');
  if (parts.length !== 3 || parts[0] !== 'v1' || !parts[1] || !parts[2]) {
    return { ok: false, reason: 'malformed' };
  }
  const [, body, signature] = parts;

  const expected = signBody(body, input.secret);
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return { ok: false, reason: 'bad_signature' };
  }

  let payload: Partial<Payload>;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Partial<Payload>;
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (payload.p !== PURPOSE) return { ok: false, reason: 'wrong_purpose' };
  if (
    typeof payload.lid !== 'string' ||
    !UUID_PATTERN.test(payload.lid) ||
    typeof payload.iat !== 'number' ||
    typeof payload.exp !== 'number'
  ) {
    return { ok: false, reason: 'malformed' };
  }
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (payload.exp < now || payload.iat > now + CLOCK_SKEW_SECONDS) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, leadId: payload.lid };
}

/** Absolute URL of the confirmation page. The token is a query param; opening it never records a sale. */
export function pilotSaleLinkUrl(baseUrl: string, token: string) {
  const url = new URL('/api/ava/sales/booked', baseUrl);
  url.searchParams.set('t', token);
  return url.toString();
}
