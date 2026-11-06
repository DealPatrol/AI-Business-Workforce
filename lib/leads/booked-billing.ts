import { nextBookedJobBillingAction, type BookedJobBillingAction } from '@/lib/ava/booked-job-billing';
import { readStripePriceId } from '@/lib/stripe-checkout';
import type { ErLead } from '@/lib/leads/types';

export const BOOKED_JOB_BILLING_TIME_ZONE = 'America/Chicago';

export function yearMonthInZone(date: Date, timeZone = BOOKED_JOB_BILLING_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  return `${year}-${month}`;
}

export function isInCurrentBillingPeriod(
  timestamp: string | null | undefined,
  now = new Date(),
  timeZone = BOOKED_JOB_BILLING_TIME_ZONE,
) {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  return yearMonthInZone(date, timeZone) === yearMonthInZone(now, timeZone);
}

export function stripeBookedJobPriceConfigured(priceId = process.env.STRIPE_AVA_BOOKED_JOB_PRICE_ID) {
  return Boolean(readStripePriceId(priceId));
}

export type BookedLeadPlan =
  | { type: 'already_booked'; action: { type: 'skip'; cents: 0 } }
  | { type: 'online_booking'; action: { type: 'skip'; cents: 0 } }
  | { type: 'missing_price_id'; action: { type: 'skip'; cents: 0 } }
  | { type: 'bill'; action: BookedJobBillingAction };

/**
 * Decide what billing should happen when an owner marks a lead Booked.
 * Never bills the same lead twice (booked_at already set).
 * When STRIPE_AVA_BOOKED_JOB_PRICE_ID is unset, this is a safe no-op.
 */
export function planBookedLeadBilling(input: {
  lead: Pick<ErLead, 'booked_at' | 'billed_at' | 'source'>;
  jobsAlreadyInPeriod: number;
  priceConfigured?: boolean;
}): BookedLeadPlan {
  if (input.lead.source === 'online booking') {
    return { type: 'online_booking', action: { type: 'skip', cents: 0 } };
  }
  if (input.lead.booked_at || input.lead.billed_at) {
    return { type: 'already_booked', action: { type: 'skip', cents: 0 } };
  }
  const priceConfigured = input.priceConfigured ?? stripeBookedJobPriceConfigured();
  if (!priceConfigured) {
    return { type: 'missing_price_id', action: { type: 'skip', cents: 0 } };
  }
  return {
    type: 'bill',
    action: nextBookedJobBillingAction(input.jobsAlreadyInPeriod),
  };
}

export function countBilledJobsInPeriod(
  leads: Array<Pick<ErLead, 'billed_at'>>,
  now = new Date(),
) {
  return leads.filter((lead) => isInCurrentBillingPeriod(lead.billed_at, now)).length;
}
