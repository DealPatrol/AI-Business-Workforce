import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HOLIDAY_FAQS, HOLIDAYS_2026, buildHolidayPlan, tenDigits } from '@/lib/er/holiday-coverage';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

describe('holiday call coverage planner', () => {
  it('lists the right weekday for every holiday date', () => {
    for (const day of HOLIDAYS_2026) {
      const d = new Date(`${day.date} 12:00:00 UTC`);
      assert.equal(WEEKDAYS[d.getUTCDay()], day.weekday, day.id);
    }
  });

  it('builds Verizon every-call codes from the shared carrier table', () => {
    const plan = buildHolidayPlan({
      shop: 'Porchlight Heating & Air',
      closedIds: ['christmas', 'new-years-day'],
      reopen: 'Monday, December 28',
      urgentMeans: 'no heat',
      carrier: 'Verizon',
      forwardTo: '(256) 555-0100',
      safetyLine: true,
    });
    assert.equal(plan.forwardOn, '*722565550100');
    assert.equal(plan.forwardOff, '*73');
    assert.equal(plan.closedDays.length, 2);
    assert.match(plan.greeting, /Porchlight Heating & Air/);
    assert.match(plan.greeting, /911/);
    assert.match(plan.receptionistNotes, /Mark as urgent: no heat/);
  });

  it('falls back to AT&T phone-settings steps when the carrier publishes no codes', () => {
    const plan = buildHolidayPlan({ shop: '', closedIds: [], reopen: '', urgentMeans: '', carrier: 'AT&T', forwardTo: '', safetyLine: false });
    assert.equal(plan.forwardOn, null);
    assert.ok(plan.carrierSteps.length > 0);
    assert.doesNotMatch(plan.greeting, /911/);
    assert.match(plan.greeting, /\[Shop name\]/);
  });

  it('normalizes 10 and 11 digit numbers only', () => {
    assert.equal(tenDigits('1 (205) 555-0199'), '2055550199');
    assert.equal(tenDigits('555-0199'), null);
  });

  it('does not claim texting or holiday surcharges', () => {
    const text = HOLIDAY_FAQS.map((f) => `${f.q} ${f.a}`).join('\n');
    assert.doesNotMatch(text, /texts you|sends you a text|holiday surcharge applies/i);
    assert.match(text, /\$25/);
    assert.match(text, /\$79/);
  });
});
