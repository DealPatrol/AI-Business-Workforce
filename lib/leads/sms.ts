/** Build a customer-initiated sms: link. Never sends a message itself. */
export function digitsOnlyPhone(value: string) {
  return value.replace(/[^\d+]/g, '');
}

export function smsHref(phone: string) {
  const digits = digitsOnlyPhone(phone);
  if (!digits) return '';
  const normalized = digits.startsWith('+') ? digits : digits.length === 10 ? `+1${digits}` : `+${digits}`;
  return `sms:${normalized}`;
}

export function telHref(phone: string) {
  const digits = digitsOnlyPhone(phone);
  if (!digits) return '';
  const normalized = digits.startsWith('+') ? digits : digits.length === 10 ? `+1${digits}` : `+${digits}`;
  return `tel:${normalized}`;
}
