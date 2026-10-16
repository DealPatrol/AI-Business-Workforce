import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { AVA_ASSISTED_LAUNCH, AVA_PLANS, avaPricingSummaryCopy, avaTrialThenPriceCopy } from '@/lib/ava/pricing';
import {
  POSTCARD_PRICE_SUMMARY,
  POSTCARD_SETUP_LABEL,
  POSTCARD_SIZES,
  formatPostcardMoney,
  postcardPackageRows,
} from '@/lib/postcards/pricing';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Labels shown to customers must be a single $ amount, never $$. */
function assertSingleDollarPrice(label: string, name: string) {
  assert.equal(label.includes('$$'), false, `${name} contains $$: ${label}`);
  assert.match(label, /\$\d/, `${name} should include a $ amount: ${label}`);
}

describe('published price labels', () => {
  it('formats postcard money with one dollar sign', () => {
    assert.equal(formatPostcardMoney(0), '$0');
    assert.equal(formatPostcardMoney(99), '$0.99');
    assert.equal(formatPostcardMoney(12700), '$127');
    assert.equal(formatPostcardMoney(354), '$3.54');
    assert.equal(formatPostcardMoney(-12700), '-$127');
    assert.equal(formatPostcardMoney(101200), '$1,012');
  });

  it('keeps catalog labels free of double dollar signs', () => {
    assertSingleDollarPrice(POSTCARD_SETUP_LABEL, 'POSTCARD_SETUP_LABEL');
    assertSingleDollarPrice(POSTCARD_SIZES['4x6'].unitLabel, '4x6 unitLabel');
    assertSingleDollarPrice(POSTCARD_SIZES['6x9'].unitLabel, '6x9 unitLabel');
    assertSingleDollarPrice(POSTCARD_PRICE_SUMMARY, 'POSTCARD_PRICE_SUMMARY');
    for (const row of postcardPackageRows()) {
      assertSingleDollarPrice(row.fourBySixLabel, `package ${row.quantity} 4x6`);
      assertSingleDollarPrice(row.sixByNineLabel, `package ${row.quantity} 6x9`);
    }

    for (const plan of Object.values(AVA_PLANS)) {
      assertSingleDollarPrice(plan.monthlyLabel, `${plan.key} monthlyLabel`);
      assertSingleDollarPrice(plan.overageLabel, `${plan.key} overageLabel`);
    }
    assertSingleDollarPrice(AVA_ASSISTED_LAUNCH.oneTimeLabel, 'assisted launch');
    assertSingleDollarPrice(avaTrialThenPriceCopy('starter'), 'trial copy');
    assertSingleDollarPrice(avaPricingSummaryCopy(), 'pricing summary');
  });

  it('does not hard-code $$digit in marketing page sources', () => {
    const pages = [
      'app/page.tsx',
      'app/pricing/page.tsx',
      'app/google-profile/page.tsx',
      'app/missed-call/page.tsx',
      'app/receptionist/page.tsx',
      'app/postcards/page.tsx',
    ];
    for (const rel of pages) {
      const source = readFileSync(path.join(root, rel), 'utf8');
      // Literal $$99-style bugs only. Template $${amount} is a single $ + interpolation.
      assert.equal(
        /\$\$\d/.test(source),
        false,
        `${rel} contains a literal $$ digit price`,
      );
    }
  });
});
