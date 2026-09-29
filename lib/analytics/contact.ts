const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string | undefined | null) {
  const email = String(value || '').trim().toLowerCase();
  return EMAIL.test(email) ? email : '';
}

/** US-leaning E.164. Returns '' when the value is not a usable phone number. */
export function toE164(value: string | undefined | null) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return '';
}

/** Digits with country code, no plus. Meta hashes this form. */
export function metaPhoneDigits(value: string | undefined | null) {
  const e164 = toE164(value);
  return e164 ? e164.slice(1) : '';
}

export function splitContact(value: string | undefined | null) {
  const trimmed = String(value || '').trim();
  if (trimmed.includes('@')) {
    return { email: normalizeEmail(trimmed), phone: '' };
  }
  return { email: '', phone: toE164(trimmed) };
}
