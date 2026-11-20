import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  loadHotLeadsCsv,
  parseCsvRows,
  validateHotLeadsCsv,
} from '@/lib/lead-lists/hot-download';

function fixture(rows: Array<[string, string, string, string, string]>): string {
  const header = 'business_name,website,email,city,state';
  const body = rows.map((row) => row.map((cell) => (cell.includes(',') ? `"${cell}"` : cell)).join(','));
  return [header, ...body].join('\n') + '\n';
}

const twoGood = fixture([
  ['Example Dental Studio', 'https://dental.example.com', 'office@dental.example.com', 'Huntsville', 'AL'],
  ['Sample Roofing Co.', 'https://roofing.example.net', 'info@roofing.example.net', 'Macon', 'GA'],
]);

describe('hot leads csv', () => {
  it('parses quoted commas in business names', () => {
    const rows = parseCsvRows('business_name,website\n"A & A Heating, LLC",https://example.com\n');
    assert.deepEqual(rows[1], ['A & A Heating, LLC', 'https://example.com']);
  });

  it('accepts a complete list with no phone numbers and unique emails', () => {
    const csv = validateHotLeadsCsv(twoGood, 2);
    assert.ok(csv);
    assert.ok(csv.includes('office@dental.example.com'));
  });

  it('rejects a short list, a phone column, a missing email, or a duplicate email', () => {
    assert.equal(validateHotLeadsCsv(twoGood, 500), null);
    assert.equal(validateHotLeadsCsv('business_name,website,email,city,phone\nn,w,a@b.co,c,AL\n', 1), null);
    const missingEmail = fixture([['Example Dental Studio', 'https://dental.example.com', '', 'Huntsville', 'AL']]);
    assert.equal(validateHotLeadsCsv(missingEmail, 1), null);
    const duplicate = fixture([
      ['Example Dental Studio', 'https://dental.example.com', 'office@dental.example.com', 'Huntsville', 'AL'],
      ['Other Studio', 'https://other.example.com', 'office@dental.example.com', 'Madison', 'AL'],
    ]);
    assert.equal(validateHotLeadsCsv(duplicate, 2), null);
  });

  it('loads from HOT_LEADS_500_CSV and ignores a bad value', () => {
    const previous = process.env.HOT_LEADS_500_CSV;
    process.env.HOT_LEADS_500_CSV = twoGood;
    assert.ok(loadHotLeadsCsv(2)?.startsWith('business_name,website,email,city,state'));
    process.env.HOT_LEADS_500_CSV = 'not a csv';
    assert.equal(loadHotLeadsCsv(2), null);
    if (previous === undefined) delete process.env.HOT_LEADS_500_CSV;
    else process.env.HOT_LEADS_500_CSV = previous;
  });
});
