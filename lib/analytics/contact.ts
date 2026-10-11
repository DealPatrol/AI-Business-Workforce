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

/** Pull an email and a phone out of a free-text staff contact, including "phone / email". */
export function parseStaffContacts(value: string | undefined | null) {
  const raw = String(value || '');
  const emailMatch = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const email = emailMatch ? normalizeEmail(emailMatch[0]) : '';
  const withoutEmail = emailMatch ? raw.replace(emailMatch[0], ' ') : raw;
  return { email, phone: toE164(withoutEmail) };
}
