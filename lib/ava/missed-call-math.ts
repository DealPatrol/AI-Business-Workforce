export type MissedCallExampleInput = {
  missedPerWeek: number;
  oneIn: number;
  jobValue: number;
};

export function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Monthly figure from caller-supplied assumptions. Not a measured close rate. */
export function missedCallExample(input: MissedCallExampleInput) {
  const missedPerWeek = Number.isFinite(input.missedPerWeek) ? Math.max(0, input.missedPerWeek) : 0;
  const oneIn = Number.isFinite(input.oneIn) ? Math.max(1, input.oneIn) : 1;
  const jobValue = Number.isFinite(input.jobValue) ? Math.max(0, input.jobValue) : 0;
  const monthly = missedPerWeek * (1 / oneIn) * jobValue * (52 / 12);
  return {
    monthly: Math.round(monthly),
    formula: `${missedPerWeek} × (1/${oneIn}) × ${jobValue} × 52 ÷ 12`,
  };
}

export function exampleSentence(input: MissedCallExampleInput & { jobLabel: string }) {
  const { monthly, formula } = missedCallExample(input);
  return `Example, not a forecast: ${input.missedPerWeek} missed calls in a week, you assume 1 in ${input.oneIn} would have become a ${input.jobLabel}, and you put that job at ${formatUsd(input.jobValue)}. The arithmetic is about ${formatUsd(monthly)} a month (${formula}). Change the inputs on the missed-call calculator. This is not a promise and not an industry average.`;
}
