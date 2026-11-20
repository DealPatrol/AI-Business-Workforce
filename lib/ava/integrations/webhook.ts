/**
 * Outbound "call completed" webhooks. Works with Zapier (Webhooks by Zapier → Catch Hook), Make, n8n,
 * or any HTTPS endpoint. Each POST is signed: X-ER-Signature: t=<unix>,v1=<hex HMAC-SHA256 of "t.body">.
 * Delivery connects only to a vetted public address (no private networks, no DNS rebinding).
 */
import { createHmac, randomBytes } from 'node:crypto';
import https from 'node:https';
import { assertPublicUrl, pinnedLookup, resolvePublicAddress } from '@/lib/prospector/safe-fetch';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptToken } from '@/lib/ava/booking/google';

export const WEBHOOK_SIGNATURE_HEADER = 'X-ER-Signature';

export type CallWebhookInput = {
  conversationId: string;
  businessName: string | null;
  callerName: string;
  callerPhone: string;
  email: string;
  address: string;
  need: string;
  urgency: string;
  callType: string;
  summary: string;
  durationSecs?: number | null;
  booked?: { window: string; start_at: string; end_at: string } | null;
  deskUrl: string;
  occurredAt: string;
};

export function newWebhookSecret() {
  return `whsec_${randomBytes(24).toString('base64url')}`;
}

export function callCompletedPayload(input: CallWebhookInput) {
  return {
    event: 'call.completed',
    version: 1,
    occurred_at: input.occurredAt,
    conversation_id: input.conversationId,
    business_name: input.businessName,
    caller: { name: input.callerName || null, phone: input.callerPhone || null, email: input.email || null, address: input.address || null },
    need: input.need || null,
    urgency: input.urgency || null,
    call_type: input.callType || null,
    summary: input.summary || null,
    duration_secs: typeof input.durationSecs === 'number' ? input.durationSecs : null,
    booking: input.booked ? { window: input.booked.window, start_at: input.booked.start_at, end_at: input.booked.end_at } : null,
    desk_url: input.deskUrl,
  };
}

export function signWebhook(body: string, secret: string, unixSeconds = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac('sha256', secret).update(`${unixSeconds}.${body}`).digest('hex');
  return `t=${unixSeconds},v1=${v1}`;
}

/** Only https URLs on public hosts. Returns a normalized URL string or throws. */
export function cleanWebhookUrl(raw: string) {
  const url = assertPublicUrl(raw.trim());
  if (url.protocol !== 'https:') throw new Error('Use an https:// URL.');
  return url.toString();
}

type Poster = (url: string, body: string, headers: Record<string, string>) => Promise<number>;

const pinnedPost: Poster = async (rawUrl, body, headers) => {
  const url = assertPublicUrl(rawUrl);
  const { address, family } = await resolvePublicAddress(url.hostname);
  return new Promise<number>((resolve, reject) => {
    const req = https.request(
      url,
      { method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(body).toString() }, lookup: pinnedLookup(address, family), timeout: 5000 },
      (res) => {
        res.resume();
        resolve(res.statusCode || 0);
      },
    );
    req.on('timeout', () => req.destroy(new Error('Webhook timed out.')));
    req.on('error', reject);
    req.end(body);
  });
};

/** POSTs one signed event, with one retry on network errors or 5xx. Never throws. */
export async function deliverWebhook(url: string, secret: string, payload: unknown, post: Poster = pinnedPost) {
  const body = JSON.stringify(payload);
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const status = await post(url, body, {
        'Content-Type': 'application/json',
        'User-Agent': 'ExecutiveReceptionist-Webhooks/1',
        [WEBHOOK_SIGNATURE_HEADER]: signWebhook(body, secret),
      });
      if (status >= 200 && status < 300) return { ok: true as const, status, attempts: attempt };
      if (status < 500) return { ok: false as const, status, attempts: attempt };
    } catch (error) {
      if (attempt === 2) return { ok: false as const, status: 0, attempts: attempt, error: error instanceof Error ? error.message : 'error' };
    }
  }
  return { ok: false as const, status: 0, attempts: 2 };
}

export type WebhookConfig = { url: string; secret: string };

/** The owner's webhook, or null (also null before the migration is applied). */
export async function webhookForOnboarding(onboardingId: string): Promise<WebhookConfig | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('ava_onboardings')
      .select('outbound_webhook_url, outbound_webhook_secret_enc')
      .eq('id', onboardingId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { outbound_webhook_url?: string | null; outbound_webhook_secret_enc?: string | null };
    if (!row.outbound_webhook_url || !row.outbound_webhook_secret_enc) return null;
    return { url: row.outbound_webhook_url, secret: decryptToken(row.outbound_webhook_secret_enc) };
  } catch {
    return null;
  }
}
