import { createHmac, timingSafeEqual } from 'node:crypto';
import { normalizeEmail } from '@/lib/prospector/gates';
import { getSiteUrl } from '@/lib/site-url';

type UnsubscribePayload = {
  o: string;
  e: string;
};

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function unsubscribeSecret(): string | null {
  const secret =
    process.env.PROSPECTOR_UNSUBSCRIBE_SECRET?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    '';
  return secret || null;
}

export function signUnsubscribeToken(ownerId: string, email: string, secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({ o: ownerId, e: normalizeEmail(email) } satisfies UnsubscribePayload),
  ).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyUnsubscribeToken(
  token: string,
  secret: string,
): { ownerId: string; email: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;
  const expected = sign(payload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<UnsubscribePayload>;
    if (!parsed.o || !parsed.e || !normalizeEmail(parsed.e).includes('@')) return null;
    return { ownerId: parsed.o, email: normalizeEmail(parsed.e) };
  } catch {
    return null;
  }
}

export function unsubscribeUrl(ownerId: string, email: string): string | null {
  const secret = unsubscribeSecret();
  if (!secret) return null;
  const base = getSiteUrl();
  const token = signUnsubscribeToken(ownerId, email, secret);
  return `${base}/prospector/unsubscribe?token=${encodeURIComponent(token)}`;
}
