import { createHash } from 'node:crypto';

export function suppressionAddressKey(address: {
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  postal_code: string;
}): string {
  const normalized = [
    address.address_line_1,
    address.address_line_2,
    address.city,
    address.state,
    address.postal_code,
  ]
    .filter(Boolean)
    .join('|')
    .toLowerCase()
    .replace(/[^a-z0-9|]/g, '');
  return createHash('sha256').update(normalized).digest('hex');
}
