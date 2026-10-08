import { createHmac, timingSafeEqual } from 'crypto';

/** ElevenLabs rejects signatures older than 30 minutes. Match that window. */
const MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Verify an ElevenLabs webhook signature.
 * Header shape: `t=<unix seconds>,v0=<hex hmac sha256 of `${timestamp}.${rawBody}`>`.
 */
export function verifyElevenLabsSignature(rawBody: string, header: string, secret: string) {
  if (!rawBody || !header || !secret) return false;

  const parts = header.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2) || '';
  const signatures = parts
    .filter((part) => part.startsWith('v0='))
    .map((part) => part.slice(3))
    .filter(Boolean);

  if (!/^\d+$/.test(timestamp) || signatures.length === 0) return false;

  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Date.now() - timestampMs > MAX_AGE_MS) return false;

  const expectedHex = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');
  const expected = Buffer.from(expectedHex, 'utf8');

  return signatures.some((signature) => {
    const actual = Buffer.from(signature, 'utf8');
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  });
}
