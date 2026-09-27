import { createHmac, timingSafeEqual } from 'node:crypto';
import { MailMode } from '@/lib/mail/config';

const LOB_API_URL = 'https://api.lob.com/v1';
const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

type Address = {
  name: string;
  company?: string | null;
  address_line1: string;
  address_line2?: string | null;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: 'US';
};

export type LobVerification = {
  id: string;
  deliverability: string;
  components?: Record<string, unknown>;
  deliverability_analysis?: Record<string, unknown>;
};

export type LobPostcard = {
  id: string;
  url?: string;
  expected_delivery_date?: string;
  date_created?: string;
};

function requireLobKey(mode: MailMode): string {
  const key = process.env.LOB_API_KEY?.trim();
  if (!key) throw new Error('LOB_API_KEY is not configured.');
  if (mode === 'test' && !key.startsWith('test_')) {
    throw new Error('Test mode requires a Lob test API key (test_*).');
  }
  if (mode === 'live' && !key.startsWith('live_')) {
    throw new Error('Live mode requires a Lob live API key (live_*).');
  }
  return key;
}

function appendForm(
  form: URLSearchParams,
  key: string,
  value: string | number | boolean | null | undefined | Record<string, unknown>,
) {
  if (value == null) return;
  if (typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value)) {
      appendForm(
        form,
        `${key}[${childKey}]`,
        childValue as string | number | boolean | null | undefined | Record<string, unknown>,
      );
    }
    return;
  }
  form.append(key, String(value));
}

async function lobRequest<T>(
  mode: MailMode,
  path: string,
  fields: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<T> {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    appendForm(
      form,
      key,
      value as string | number | boolean | null | undefined | Record<string, unknown>,
    );
  }

  const response = await fetch(`${LOB_API_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${requireLobKey(mode)}:`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: form,
    cache: 'no-store',
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || `Lob API ${response.status}`);
  }
  return payload as T;
}

export function verifyUsAddress(
  mode: MailMode,
  address: Address,
): Promise<LobVerification> {
  return lobRequest<LobVerification>(mode, '/us_verifications', {
    primary_line: address.address_line1,
    secondary_line: address.address_line2,
    city: address.address_city,
    state: address.address_state,
    zip_code: address.address_zip,
  });
}

export function isDeliverable(result: LobVerification): boolean {
  return ['deliverable', 'deliverable_unnecessary_unit'].includes(result.deliverability);
}

export function createPostcard(input: {
  mode: MailMode;
  description: string;
  to: Address;
  from: Address;
  front: string;
  back: string;
  size: '4x6' | '6x9';
  recipientId: string;
}): Promise<LobPostcard> {
  return lobRequest<LobPostcard>(
    input.mode,
    '/postcards',
    {
      description: input.description.slice(0, 255),
      to: input.to,
      from: input.from,
      front: input.front,
      back: input.back,
      size: input.size,
      mail_type: 'usps_first_class',
      use_type: 'marketing',
      metadata: { recipient_id: input.recipientId },
    },
    `postcard-${input.mode}-${input.recipientId}`,
  );
}

export function verifyLobWebhook(input: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  secret: string;
  nowSeconds?: number;
}): boolean {
  if (!input.signature || !input.timestamp || !/^\d+$/.test(input.timestamp)) return false;
  const timestamp = Number(input.timestamp);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > MAX_WEBHOOK_AGE_SECONDS) {
    return false;
  }

  const expected = createHmac('sha256', input.secret)
    .update(`${input.timestamp}.${input.rawBody}`)
    .digest('hex');
  const actualBuffer = Buffer.from(input.signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
