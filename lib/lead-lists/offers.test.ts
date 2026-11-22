import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HOT_LEADS_SAMPLE_ROWS, maskLeadEmail } from '@/lib/lead-lists/offers';

describe('hot leads public sample', () => {
  it('masks emails as first two local characters plus bullets and the real domain', () => {
    assert.equal(maskLeadEmail('office@domain.com'), 'of•••@domain.com');
    assert.equal(maskLeadEmail('ab@shop.example'), 'ab•••@shop.example');
    assert.equal(maskLeadEmail('a@x.com'), 'a•••@x.com');
  });

  it('has 10 real-list rows with masked emails and no phone numbers', () => {
    assert.equal(HOT_LEADS_SAMPLE_ROWS.length, 10);
    const names = new Set<string>();
    for (const row of HOT_LEADS_SAMPLE_ROWS) {
      assert.ok(row.business_name);
      assert.ok(row.website);
      assert.ok(row.city);
      assert.ok(row.state);
      assert.match(row.email, /^[^@]{1,2}•••@[^@]+\.[^@]+$/);
      assert.doesNotMatch(row.email, /(?:\+?1[-.\s]*)?\(?\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}/);
      assert.doesNotMatch(`${row.business_name} ${row.website} ${row.city} ${row.state}`, /\d{3}[-.\s]\d{3}[-.\s]\d{4}/);
      names.add(row.business_name);
    }
    assert.equal(names.size, 10);
  });
});
