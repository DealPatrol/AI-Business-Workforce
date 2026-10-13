if (typeof window !== 'undefined') throw new Error('lib/mail/lob is server-only.');

/** All-in YardProof pricing shown to clients (print + postage included). */
export const YARDPROOF_PRICING = {
  monthly: 99,
  perCard: { '4x6': 1.49, '6x9': 1.79 } as const,
};

export type PostcardSize = keyof typeof YARDPROOF_PRICING.perCard;

/** Only Lob TEST keys are accepted on this branch: test mode never prints or mails. */
export function lobTestKey(): string | null {
  const key = process.env.LOB_API_KEY?.trim();
  if (!key) return null;
  if (!key.startsWith('test_')) {
    throw new Error('LOB_API_KEY must be a Lob TEST key (test_...). Live mailing is disabled on this build.');
  }
  return key;
}

export type LobAddress = {
  name: string;
  address_line1: string;
  address_city: string;
  address_state: string;
  address_zip: string;
};

export async function createTestPostcard(input: {
  to: LobAddress;
  from: LobAddress;
  size: PostcardSize;
  frontHtml: string;
  backHtml: string;
  description?: string;
}) {
  const key = lobTestKey();
  if (!key) throw new Error('LOB_API_KEY (test key) is not configured.');
  const res = await fetch('https://api.lob.com/v1/postcards', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: input.description ?? 'YardProof test postcard',
      to: input.to,
      from: input.from,
      size: input.size,
      front: input.frontHtml,
      back: input.backHtml,
      use_type: 'marketing',
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = (data.error as { message?: string } | undefined)?.message;
    throw new Error(`Lob error (HTTP ${res.status})${err ? `: ${err}` : ''}`);
  }
  return { id: String(data.id), url: data.url as string | undefined, expectedDelivery: data.expected_delivery_date };
}
