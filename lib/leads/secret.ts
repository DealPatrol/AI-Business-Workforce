import { timingSafeEqual } from 'crypto';

export function ingestSecretConfigured() {
  return Boolean(process.env.LEADS_INGEST_SECRET?.trim());
}

export function authorizeIngestRequest(authorizationHeader: string | null) {
  const secret = process.env.LEADS_INGEST_SECRET?.trim() ?? '';
  if (!secret) return { configured: false as const, ok: false as const };
  const expected = `Bearer ${secret}`;
  const provided = authorizationHeader ?? '';
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  const ok =
    providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
  return { configured: true as const, ok };
}
