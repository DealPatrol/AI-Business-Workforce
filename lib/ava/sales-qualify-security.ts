import { createHmac, timingSafeEqual } from 'crypto';

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';

/** In-memory rate limits (best-effort on serverless). */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { ok: true };
}

export function clientIp(req: { headers: Headers }): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim().slice(0, 64);
  return 'unknown';
}

export type SalesConversationVerification =
  | { ok: true; conversationId: string; agentId: string; status: string }
  | { ok: false; status: number; error: string };

/**
 * Prove conversationId exists at ElevenLabs, is finished, and belongs to the Sales Ava agent.
 */
export async function verifySalesConversation(
  conversationId: string,
): Promise<SalesConversationVerification> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const salesAgentId = process.env.ELEVENLABS_SALES_AGENT_ID;
  if (!apiKey) {
    return { ok: false, status: 503, error: 'ELEVENLABS_API_KEY is not configured' };
  }
  if (!salesAgentId) {
    return { ok: false, status: 503, error: 'ELEVENLABS_SALES_AGENT_ID is not configured' };
  }

  const id = conversationId.trim();
  if (!id || id.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return { ok: false, status: 400, error: 'Invalid conversationId' };
  }

  try {
    const response = await fetch(
      `${ELEVENLABS_API}/convai/conversations/${encodeURIComponent(id)}`,
      { headers: { 'xi-api-key': apiKey }, cache: 'no-store' },
    );
    const data = (await response.json().catch(() => ({}))) as {
      conversation_id?: string;
      agent_id?: string;
      status?: string;
    };

    if (response.status === 404) {
      return { ok: false, status: 403, error: 'Conversation not found or not authorized.' };
    }
    if (!response.ok) {
      return {
        ok: false,
        status: response.status >= 500 ? 502 : 403,
        error: 'Unable to verify conversation with ElevenLabs.',
      };
    }

    const agentId = String(data.agent_id || '');
    if (!agentId || agentId !== salesAgentId) {
      return {
        ok: false,
        status: 403,
        error: 'Conversation does not belong to the Sales Ava agent.',
      };
    }

    const status = String(data.status || '');
    // Accept done only — blocks spam inserts for random/in-progress IDs.
    if (status !== 'done') {
      return {
        ok: false,
        status: 409,
        error: `Conversation is not complete yet (status: ${status || 'unknown'}).`,
      };
    }

    return {
      ok: true,
      conversationId: String(data.conversation_id || id),
      agentId,
      status,
    };
  } catch (error) {
    console.error('verifySalesConversation failed', error);
    return { ok: false, status: 502, error: 'Unable to verify conversation with ElevenLabs.' };
  }
}

function prefillSigningSecret(): string | null {
  return (
    process.env.AVA_QUALIFY_PREFILL_SECRET ||
    process.env.AVA_PROVISIONING_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    null
  );
}

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromB64url(input: string): Buffer | null {
  try {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    return Buffer.from(padded + pad, 'base64');
  } catch {
    return null;
  }
}

export type PrefillTokenPayload = {
  qid: string;
  exp: number;
};

const DEFAULT_PREFILL_TTL_SEC = 60 * 60 * 2; // 2 hours

export function mintPrefillToken(
  qualificationId: string,
  ttlSec = DEFAULT_PREFILL_TTL_SEC,
): string | null {
  const secret = prefillSigningSecret();
  if (!secret || !qualificationId) return null;
  const payload: PrefillTokenPayload = {
    qid: qualificationId,
    exp: Math.floor(Date.now() / 1000) + ttlSec,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac('sha256', secret).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyPrefillToken(
  token: string | null | undefined,
  qualificationId: string,
): boolean {
  const secret = prefillSigningSecret();
  if (!secret || !token || !qualificationId) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [body, sig] = parts;
  if (!body || !sig || body.length > 512 || sig.length > 128) return false;

  const expected = b64url(createHmac('sha256', secret).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const raw = fromB64url(body);
  if (!raw) return false;
  try {
    const payload = JSON.parse(raw.toString('utf8')) as PrefillTokenPayload;
    if (!payload?.qid || payload.qid !== qualificationId) return false;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
