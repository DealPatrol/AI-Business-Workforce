/**
 * Outcome-based "pilot" pricing for Executive Receptionist.
 *
 * 14-day free trial (card collected at checkout), then a monthly base by call volume
 * plus $50 for each booked job the owner confirms, with the TOTAL monthly bill capped at $397.
 *
 * This is deliberately separate from AVA_PLANS ($77 / $168 / $324, 7-day trial, minutes + overage).
 * Nothing here is imported by the live /receptionist checkout.
 */

export const PILOT_TRIAL_DAYS = 14;
export const PILOT_SALE_CENTS = 5000;
export const PILOT_MONTHLY_CAP_CENTS = 39700;

/** Stored on ava_customers.plan and Stripe metadata[plan]. Prefix keeps them out of AVA_PLANS lookups. */
export const PILOT_PLANS = {
  pilot_97: {
    key: 'pilot_97',
    label: 'Pilot Starter',
    productName: 'Executive Receptionist – Pilot Starter',
    baseCents: 9700,
    baseLabel: '$97',
    callVolume: 'Up to 100 calls a month',
    lookupKey: 'ava_pilot_97_monthly',
  },
  pilot_147: {
    key: 'pilot_147',
    label: 'Pilot Growth',
    productName: 'Executive Receptionist – Pilot Growth',
    baseCents: 14700,
    baseLabel: '$147',
    callVolume: 'Up to 250 calls a month',
    lookupKey: 'ava_pilot_147_monthly',
  },
  pilot_197: {
    key: 'pilot_197',
    label: 'Pilot Pro',
    productName: 'Executive Receptionist – Pilot Pro',
    baseCents: 19700,
    baseLabel: '$197',
    callVolume: 'Up to 500 calls a month',
    lookupKey: 'ava_pilot_197_monthly',
  },
} as const;

export type PilotPlanKey = keyof typeof PILOT_PLANS;
export const PILOT_PLAN_KEYS = Object.keys(PILOT_PLANS) as PilotPlanKey[];

export function isPilotPlanKey(value: string | null | undefined): value is PilotPlanKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PILOT_PLANS, value);
}

export function pilotPriceIdEnvName(key: PilotPlanKey) {
  return `STRIPE_AVA_PILOT_${key.replace('pilot_', '')}_PRICE_ID`;
}

export function pilotTermsCopy(key: PilotPlanKey) {
  const plan = PILOT_PLANS[key];
  return `Free ${PILOT_TRIAL_DAYS}-day trial, then ${plan.baseLabel}/mo plus $${PILOT_SALE_CENTS / 100} for each booked job. Total capped at $${PILOT_MONTHLY_CAP_CENTS / 100}/mo.`;
}

export type SaleBillingOutcome = 'billed' | 'partial_cap' | 'capped' | 'trial' | 'inactive';

export type SaleBillingDecision = {
  outcome: SaleBillingOutcome;
  /** Cents added to the next invoice for this sale. 0 when the sale is recorded but not billed. */
  billedCents: number;
};

/** Subscription states where a sale can be billed on a coming invoice. */
const BILLABLE_STATUSES = new Set(['active', 'past_due']);

/**
 * Decides what a newly recorded sale costs.
 *
 * - trialing: recorded, never billed (free pilot), and does not count toward the cap.
 * - active / past_due: $50, trimmed so base + sale charges for this billing period never exceed the cap.
 * - anything else (canceled, unpaid, paused, ...): recorded, not billed, flagged 'inactive'.
 *
 * `billedSoFarCents` is the sum already billed for sales in the SAME billing period (same invoice).
 */
export function decideSaleBilling(input: {
  subscriptionStatus: string;
  baseCents: number;
  billedSoFarCents: number;
  saleCents?: number;
  capCents?: number;
}): SaleBillingDecision {
  const status = (input.subscriptionStatus || '').trim().toLowerCase();
  const sale = input.saleCents ?? PILOT_SALE_CENTS;
  const cap = input.capCents ?? PILOT_MONTHLY_CAP_CENTS;

  if (status === 'trialing') return { outcome: 'trial', billedCents: 0 };
  if (!BILLABLE_STATUSES.has(status)) return { outcome: 'inactive', billedCents: 0 };

  const remaining = Math.max(0, cap - Math.max(0, input.baseCents) - Math.max(0, input.billedSoFarCents));
  if (remaining <= 0) return { outcome: 'capped', billedCents: 0 };
  if (remaining < sale) return { outcome: 'partial_cap', billedCents: remaining };
  return { outcome: 'billed', billedCents: sale };
}
