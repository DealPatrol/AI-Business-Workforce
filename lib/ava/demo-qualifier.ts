import { AVA_PLANS, AVA_PLAN_KEYS, type AvaPlanKey } from '@/lib/ava/pricing';
import { GBP_BUNDLES, GBP_CARE, type GbpBundle } from '@/lib/ava/gbp-packages';
import { formatUsd, missedCallExample } from '@/lib/ava/missed-call-math';

/**
 * Browser-side package qualifier for the Book-a-demo page. Pure arithmetic on the visitor's own
 * numbers: no AI call, no paid API, no stored data until they choose to send the form.
 */
export type GbpState = 'none' | 'thin' | 'good';

export type QualifierInput = {
  callsPerWeek: number;
  missedPercent: number;
  minutesPerCall: number;
  jobValue: number;
  oneIn: number;
  gbp: GbpState;
};

export type QualifierResult = {
  missedPerWeek: number;
  minutesPerMonth: number;
  plan: AvaPlanKey;
  bundle: GbpBundle | null;
  monthlyExample: number;
  formula: string;
  summary: string;
  heat: 'hot' | 'warm' | 'cool';
};

const WEEKS_PER_MONTH = 52 / 12;

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Smallest plan whose included minutes cover the estimate; Elite past 2,000. */
export function planForMinutes(minutes: number): AvaPlanKey {
  for (const key of AVA_PLAN_KEYS) {
    if (AVA_PLANS[key].minutes >= minutes) return key;
  }
  return 'elite';
}

export function bundleForPlan(plan: AvaPlanKey): GbpBundle | null {
  if (plan === 'overflow' || plan === 'starter') return GBP_BUNDLES.find((b) => b.plan === 'starter') ?? null;
  if (plan === 'growth') return GBP_BUNDLES.find((b) => b.plan === 'growth') ?? null;
  if (plan === 'pro') return GBP_BUNDLES.find((b) => b.plan === 'pro') ?? null;
  return null;
}

export function qualify(raw: QualifierInput): QualifierResult {
  const callsPerWeek = clamp(raw.callsPerWeek, 0, 2000);
  const missedPercent = clamp(raw.missedPercent, 0, 100);
  const minutesPerCall = clamp(raw.minutesPerCall, 1, 30);
  const jobValue = clamp(raw.jobValue, 0, 100000);
  const oneIn = clamp(raw.oneIn, 1, 100);

  const missedPerWeek = Math.round(callsPerWeek * (missedPercent / 100) * 10) / 10;
  const minutesPerMonth = Math.ceil(missedPerWeek * WEEKS_PER_MONTH * minutesPerCall);
  const plan = planForMinutes(minutesPerMonth);
  const wantsProfileHelp = raw.gbp !== 'good';
  const bundle = wantsProfileHelp ? bundleForPlan(plan) : null;
  const { monthly, formula } = missedCallExample({ missedPerWeek, oneIn, jobValue });
  const planCents = bundle ? bundle.monthlyCents : AVA_PLANS[plan].monthlyCents;
  const ratio = planCents > 0 ? (monthly * 100) / planCents : 0;
  const heat: QualifierResult['heat'] = ratio >= 3 ? 'hot' : ratio >= 1 ? 'warm' : 'cool';

  const planLine = `${AVA_PLANS[plan].label} (${AVA_PLANS[plan].minutesLabel}, ${AVA_PLANS[plan].monthlyLabel}/mo)`;
  const careLine = bundle
    ? `the ${bundle.label} bundle: ${planLine} plus ${GBP_CARE[bundle.care].label}, ${formatUsd(bundle.monthlyCents / 100)}/mo`
    : planLine;
  const summary = `About ${missedPerWeek} missed calls a week is roughly ${minutesPerMonth} Ava minutes a month, so the fit is ${careLine}. With your numbers, the missed calls are worth about ${formatUsd(monthly)} a month (${formula}). That is arithmetic on your inputs, not a forecast.`;

  return { missedPerWeek, minutesPerMonth, plan, bundle, monthlyExample: monthly, formula, summary, heat };
}
