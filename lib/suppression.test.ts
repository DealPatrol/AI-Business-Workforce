import { describe, expect, it } from 'vitest';
import { suppressionAddressKey } from '@/lib/suppression';

describe('suppression address keys', () => {
  it('normalizes case and punctuation for cross-campaign matching', () => {
    const first = suppressionAddressKey({
      address_line_1: '123 Main St.',
      city: 'Huntsville',
      state: 'AL',
      postal_code: '35801',
    });
    const second = suppressionAddressKey({
      address_line_1: '123 MAIN ST',
      city: 'HUNTSVILLE',
      state: 'al',
      postal_code: '35801',
    });
    expect(first).toBe(second);
  });
});
