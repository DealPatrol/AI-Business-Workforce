/**
 * Direct mail via Lob — TEST MODE ONLY, behind a manual approval.
 *
 * Rules enforced here (not just in the UI):
 * - Only a Lob TEST secret key (prefix "test_") is accepted. A live key is
 *   refused, so this code cannot print or mail a real card or spend money.
 * - The lead must have been approved by a signed-in user first.
 * - With no key set, sending is disabled (503) and the dashboard says so.
 *
 * Env:
 *   LOB_TEST_API_KEY=test_...   (free Lob account -> Settings -> API Keys -> Test)
 *   AERIAL_LEADS_RETURN_ADDRESS='{"name":"...","address_line1":"...","address_city":"...","address_state":"AL","address_zip":"..."}'
 */

import type { MailingAddress } from './parcels';

export type LobAddress = {
  name: string;
  address_line1: string;
  address_line2?: string;
  address_city: string;
  address_state: string;
  address_zip: string;
};

export type MailStatus =
  | { enabled: true; mode: 'test' }
  | { enabled: false; reason: string };

export function lobTestKey(): string | null {
  const key = (process.env.LOB_TEST_API_KEY || process.env.LOB_API_KEY || '').trim();
  return key || null;
}

export function mailStatus(): MailStatus {
  const key = lobTestKey();
  if (!key) return { enabled: false, reason: 'Set LOB_TEST_API_KEY (a free Lob test key) to send test postcards.' };
  if (!key.startsWith('test_')) return { enabled: false, reason: 'Only a Lob test key (test_...) is allowed. Live mail is disabled in this feature.' };
  if (!returnAddress()) return { enabled: false, reason: 'Set AERIAL_LEADS_RETURN_ADDRESS (the business return address JSON).' };
  return { enabled: true, mode: 'test' };
}

export function returnAddress(): LobAddress | null {
  const raw = process.env.AERIAL_LEADS_RETURN_ADDRESS?.trim();
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<LobAddress>;
    if (!v.name || !v.address_line1 || !v.address_city || !v.address_state || !v.address_zip) return null;
    return v as LobAddress;
  } catch {
    return null;
  }
}

export function toLobAddress(mailing: MailingAddress): LobAddress {
  return {
    name: mailing.name.slice(0, 40),
    address_line1: mailing.line1,
    ...(mailing.line2 ? { address_line2: mailing.line2 } : {}),
    address_city: mailing.city,
    address_state: mailing.state,
    address_zip: mailing.zip,
  };
}

export type ApprovalState = { status: string; approvedAt: string | null; approvedBy: string | null };

export function assertApproved(state: ApprovalState): void {
  if (state.status !== 'approved' || !state.approvedAt || !state.approvedBy) {
    throw new Error('Approve this card before sending a test mailing.');
  }
}

/** Create a TEST postcard at Lob. Returns Lob's id and proof URL. */
export async function sendTestPostcard(input: {
  to: LobAddress;
  front: Buffer;
  back: Buffer;
  description: string;
  approval: ApprovalState;
}): Promise<{ id: string; url: string | null; expectedDelivery: string | null }> {
  assertApproved(input.approval);
  const status = mailStatus();
  if (!status.enabled) throw new Error(status.reason);
  const key = lobTestKey() as string;
  if (!key.startsWith('test_')) throw new Error('Live Lob keys are refused.');
  const from = returnAddress() as LobAddress;

  const form = new FormData();
  form.set('description', input.description.slice(0, 255));
  form.set('size', '4x6');
  form.set('use_type', 'marketing');
  for (const [k, v] of Object.entries(input.to)) form.set(`to[${k}]`, String(v));
  for (const [k, v] of Object.entries(from)) form.set(`from[${k}]`, String(v));
  form.set('front', new Blob([new Uint8Array(input.front)], { type: 'image/png' }), 'front.png');
  form.set('back', new Blob([new Uint8Array(input.back)], { type: 'image/png' }), 'back.png');

  const response = await fetch('https://api.lob.com/v1/postcards', {
    method: 'POST',
    headers: { authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}` },
    body: form,
  });
  const json = (await response.json().catch(() => ({}))) as { id?: string; url?: string; expected_delivery_date?: string; error?: { message?: string } };
  if (!response.ok || !json.id) throw new Error(`Lob test request failed: ${json.error?.message ?? response.status}`);
  return { id: json.id, url: json.url ?? null, expectedDelivery: json.expected_delivery_date ?? null };
}
