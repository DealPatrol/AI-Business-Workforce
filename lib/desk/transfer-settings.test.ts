import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanTransferSettings, deskTransferRules } from './transfer-settings';

test('cleans up to three named rules and fills default labels', () => {
  const r = cleanTransferSettings({
    rules: [
      { label: 'On-call tech', phone: '(205) 555-0101', reason: 'emergency' },
      { label: '', phone: '205-555-0102', reason: 'billing' },
      { label: 'Sales', phone: '2055550103', reason: 'custom', when: 'Caller wants a new system quote' },
      { label: 'Blank row', phone: '', reason: 'person' },
    ],
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(
    r.rules.map((x) => [x.label, x.phone, x.reason]),
    [
      ['On-call tech', '+12055550101', 'emergency'],
      ['Billing', '+12055550102', 'billing'],
      ['Sales', '+12055550103', 'custom'],
    ],
  );
  assert.equal(r.rules[2].when, 'Caller wants a new system quote');
});

test('rejects bad, duplicate, banned and too many numbers', () => {
  assert.match((cleanTransferSettings({ rules: [{ phone: '555' }] }) as { error: string }).error, /Number 1/);
  assert.match(
    (cleanTransferSettings({ rules: [{ phone: '2055550101' }, { phone: '(205) 555-0101' }] }) as { error: string }).error,
    /already listed/,
  );
  assert.equal(cleanTransferSettings({ rules: [{ phone: '256-663-7007' }] }).ok, false);
  assert.equal(
    cleanTransferSettings({ rules: [1, 2, 3, 4].map((i) => ({ phone: `205555010${i}` })) }).ok,
    false,
  );
  assert.equal(cleanTransferSettings({ rules: [{ phone: '2055550101', reason: 'custom', when: '' }] }).ok, false);
  assert.equal(cleanTransferSettings({ rules: [{ phone: '2055550101', label: 'see www.x.com' }] }).ok, false);
});

test('empty list turns transfer off; desk falls back to the legacy number', () => {
  const r = cleanTransferSettings({ rules: [] });
  assert.equal(r.ok && r.rules.length, 0);
  assert.deepEqual(deskTransferRules({ transfer_rules: null, transfer_phone: '+12055550101' }).map((x) => x.label), ['Owner']);
  assert.deepEqual(deskTransferRules(null), []);
});
