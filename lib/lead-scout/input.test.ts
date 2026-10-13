import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readLeadScoutQuery } from '@/lib/lead-scout/input';

describe('lead scout input', () => {
  it('accepts a listed trade and a city', () => {
    const result = readLeadScoutQuery({ trade: 'Plumber', city: 'Hanceville, AL' });
    assert.deepEqual(result, { ok: true, trade: 'plumber', city: 'Hanceville, AL' });
  });

  it('rejects a trade that is not on the list', () => {
    const result = readLeadScoutQuery({ trade: 'anything', city: 'Hanceville' });
    assert.equal(result.ok, false);
  });
});
