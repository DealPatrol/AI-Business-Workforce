import { randomUUID } from 'crypto';
import { sanitizeAttribution, type Attribution } from '@/lib/analytics/attribution';
import { getSiteUrl } from '@/lib/site-url';

const EVENT_ID = /^[A-Za-z0-9-]{8,64}$/;
const COOKIE_ID = /^[A-Za-z0-9._-]{1,200}$/;

export function readEventId(value: unknown) {
  const id = String(value || '').trim();
  return EVENT_ID.test(id) ? id : randomUUID();
}

export function readCookieId(value: unknown) {
  const raw = String(value || '').trim();
  return COOKIE_ID.test(raw) ? raw : '';
}

export function readRequestAttribution(value: unknown): Attribution {
  return sanitizeAttribution(value);
}

export function safePageUrl(value: unknown, origin: string) {
  const raw = String(value || '').trim();
  if (!raw) return origin;
  try {
    const url = new URL(raw);
    if (url.origin !== origin && url.origin !== getSiteUrl()) return origin;
    return url.toString().slice(0, 500);
  } catch {
    return origin;
  }
}

export function clientIp(header: string | null) {
  const first = String(header || '').split(',')[0]?.trim() || '';
  return /^[0-9a-fA-F:.]+$/.test(first) ? first.slice(0, 64) : '';
}
