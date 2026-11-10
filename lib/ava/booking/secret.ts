import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const TOOL_SECRET_HEADER = 'x-ava-tool-secret';

export function newToolSecret() {
  return `avt_${randomBytes(24).toString('base64url')}`;
}

export function hashToolSecret(secret: string) {
  return createHash('sha256').update(secret.trim()).digest('hex');
}

export function sameHash(a: string, b: string) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
