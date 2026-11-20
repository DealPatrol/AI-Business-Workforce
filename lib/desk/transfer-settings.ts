/** Validation for the Desk "Live transfer" form. Pure: no network, no database. */
import {
  MAX_TRANSFER_NUMBERS,
  normalizeTransferRules,
  toUsE164,
  type TransferReason,
  type TransferRule,
} from '@/lib/ava/capabilities/transfer';

export const TRANSFER_REASON_LABEL: Record<TransferReason, string> = {
  emergency: 'Emergencies',
  person: 'Caller asks for a person',
  billing: 'Billing and payment questions',
  custom: 'Something else (describe it)',
};

const BANNED_NUMBER = /663[\s.\-)]*7007/;
const URLISH = /(https?:\/\/|www\.)/i;
const REASONS = Object.keys(TRANSFER_REASON_LABEL) as TransferReason[];

export type TransferSettingsResult = { ok: true; rules: TransferRule[] } | { ok: false; error: string };

function text(value: unknown, max: number) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * Up to three named transfer rules from the Desk form. Rows with an empty phone are ignored, so an owner
 * can clear a row. An empty list turns live transfer off. Errors name the row so the owner can fix it.
 */
export function cleanTransferSettings(body: unknown): TransferSettingsResult {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Nothing to save.' };
  const raw = (body as Record<string, unknown>).rules;
  if (!Array.isArray(raw)) return { ok: false, error: 'Nothing to save.' };
  const rows = raw.filter((row) => row && typeof row === 'object' && text((row as Record<string, unknown>).phone, 40));
  if (rows.length > MAX_TRANSFER_NUMBERS) return { ok: false, error: `Add up to ${MAX_TRANSFER_NUMBERS} transfer numbers.` };

  const seen = new Set<string>();
  const cleaned: Array<{ label: string; phone: string; reason: TransferReason; when?: string }> = [];
  for (const [index, item] of rows.entries()) {
    const row = item as Record<string, unknown>;
    const n = index + 1;
    const label = text(row.label, 40);
    const when = text(row.when, 200);
    const rawPhone = text(row.phone, 40);
    if (BANNED_NUMBER.test(rawPhone)) return { ok: false, error: `Number ${n}: that phone number cannot be used.` };
    const phone = toUsE164(rawPhone);
    if (!phone) return { ok: false, error: `Number ${n}: enter a 10-digit US phone number.` };
    if (seen.has(phone)) return { ok: false, error: `Number ${n}: that number is already listed.` };
    seen.add(phone);
    const reason = REASONS.includes(row.reason as TransferReason) ? (row.reason as TransferReason) : 'person';
    if (reason === 'custom' && when.length < 5) return { ok: false, error: `Number ${n}: describe when Ava should use this number.` };
    for (const value of [label, when]) {
      if (/[{}<>]/.test(value) || URLISH.test(value)) return { ok: false, error: `Number ${n}: use plain words (no links or brackets).` };
      if (BANNED_NUMBER.test(value)) return { ok: false, error: `Number ${n}: that phone number cannot be used.` };
    }
    cleaned.push({ label, phone, reason, ...(reason === 'custom' ? { when } : {}) });
  }
  return { ok: true, rules: normalizeTransferRules({ transferRules: cleaned }) };
}

/** The rules the Desk shows: stored rules, or the legacy single transfer number. */
export function deskTransferRules(row: Record<string, unknown> | null | undefined): TransferRule[] {
  if (!row) return [];
  return normalizeTransferRules({ transferRules: row.transfer_rules, transferNumber: (row.transfer_phone as string) || null });
}
