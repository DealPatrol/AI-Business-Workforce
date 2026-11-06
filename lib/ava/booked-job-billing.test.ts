import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BOOKED_JOB_MONTHLY_CAP_CENTS,
  bookedJobsBillableCents,
  nextBookedJobBillingAction,
} from '@/lib/ava/booked-job-billing';

describe('booked job monthly cap', () => {
  it('meters the first 11 jobs at $25', () => {
    assert.deepEqual(nextBookedJobBillingAction(0), { type: 'meter', value: 1, cents: 2500 });
    assert.deepEqual(nextBookedJobBillingAction(10), { type: 'meter', value: 1, cents: 2500 });
    assert.equal(bookedJobsBillableCents(11), 27500);
  });

  it('adds a $22 invoice item for the 12th job and then stops', () => {
    assert.deepEqual(nextBookedJobBillingAction(11), { type: 'invoice_item', cents: 2200 });
    assert.deepEqual(nextBookedJobBillingAction(12), { type: 'skip', cents: 0 });
    assert.equal(bookedJobsBillableCents(12), BOOKED_JOB_MONTHLY_CAP_CENTS);
    assert.equal(bookedJobsBillableCents(40), BOOKED_JOB_MONTHLY_CAP_CENTS);
  });
});
