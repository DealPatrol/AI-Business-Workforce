/**
 * App-side cap for the $25-per-booked-job meter.
 *
 * Stripe bills $25 for each `booked_job` meter event. A raw sum would go past
 * $297 on the 12th job ($300). Stop sending meter events after 11 jobs ($275)
 * and add a $22 invoice item for the 12th job so the period totals $297.
 * Further jobs in the same period are not billed.
 *
 * Meter events should be sent only when the owner confirms a booked job
 * (weekly report / admin action), never automatically from the AI.
 */
export const BOOKED_JOB_EVENT_NAME = 'booked_job';
export const BOOKED_JOB_CENTS = 2500;
export const BOOKED_JOB_MONTHLY_CAP_CENTS = 29700;
export const BOOKED_JOB_FULL_UNITS_BEFORE_CAP = 11; // 11 × $25 = $275
export const BOOKED_JOB_CAP_REMAINDER_CENTS = 2200; // 12th job to reach $297

export type BookedJobBillingAction =
  | { type: 'meter'; value: 1; cents: number }
  | { type: 'invoice_item'; cents: number }
  | { type: 'skip'; cents: 0 };

export function nextBookedJobBillingAction(jobsAlreadyInPeriod: number): BookedJobBillingAction {
  const counted = Number.isFinite(jobsAlreadyInPeriod) ? Math.max(0, Math.floor(jobsAlreadyInPeriod)) : 0;
  if (counted < BOOKED_JOB_FULL_UNITS_BEFORE_CAP) {
    return { type: 'meter', value: 1, cents: BOOKED_JOB_CENTS };
  }
  if (counted === BOOKED_JOB_FULL_UNITS_BEFORE_CAP) {
    return { type: 'invoice_item', cents: BOOKED_JOB_CAP_REMAINDER_CENTS };
  }
  return { type: 'skip', cents: 0 };
}

export function bookedJobsBillableCents(jobsInPeriod: number) {
  const counted = Number.isFinite(jobsInPeriod) ? Math.max(0, Math.floor(jobsInPeriod)) : 0;
  if (counted <= BOOKED_JOB_FULL_UNITS_BEFORE_CAP) return counted * BOOKED_JOB_CENTS;
  return BOOKED_JOB_MONTHLY_CAP_CENTS;
}
