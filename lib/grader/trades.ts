export type GraderTrade = { key: string; label: string; terms: string[] };

/** Trades offered in the grader form. `terms` are the words we look for on the page. */
export const GRADER_TRADES: GraderTrade[] = [
  { key: 'hvac', label: 'HVAC / heating & air', terms: ['hvac', 'heating', 'air conditioning', 'air conditioner', 'a/c', 'ac repair', 'furnace', 'heat pump', 'cooling'] },
  { key: 'plumbing', label: 'Plumbing', terms: ['plumbing', 'plumber', 'drain', 'water heater', 'sewer', 'leak'] },
  { key: 'roofing', label: 'Roofing', terms: ['roofing', 'roofer', 'roof', 'shingle', 'gutter'] },
  { key: 'lawn-care', label: 'Lawn care / landscaping', terms: ['lawn', 'mowing', 'landscaping', 'landscaper', 'yard', 'sod', 'mulch'] },
  { key: 'cleaning', label: 'House cleaning', terms: ['cleaning', 'cleaner', 'maid', 'janitorial'] },
  { key: 'electrical', label: 'Electrical', terms: ['electrician', 'electrical', 'wiring', 'panel upgrade'] },
  { key: 'pest-control', label: 'Pest control', terms: ['pest control', 'pest', 'exterminator', 'termite'] },
  { key: 'pressure-washing', label: 'Pressure washing', terms: ['pressure washing', 'power washing', 'soft wash', 'pressure wash'] },
  { key: 'painting', label: 'Painting', terms: ['painting', 'painter', 'paint'] },
  { key: 'garage-door', label: 'Garage doors', terms: ['garage door', 'garage doors', 'opener'] },
  { key: 'tree-service', label: 'Tree service', terms: ['tree service', 'tree removal', 'tree trimming', 'stump', 'arborist'] },
  { key: 'pool', label: 'Pool service', terms: ['pool', 'pool cleaning', 'pool service'] },
  { key: 'marketing', label: 'Marketing / agency', terms: ['marketing', 'seo', 'advertising', 'agency', 'leads'] },
];

const STOP = new Set(['and', 'the', 'for', 'service', 'services', 'company', 'repair', 'local', 'home', 'care']);

export function tradeTerms(input: string): { label: string; terms: string[] } {
  const raw = input.trim();
  const lower = raw.toLowerCase();
  const known = GRADER_TRADES.find((trade) => trade.key === lower || trade.label.toLowerCase() === lower);
  if (known) return { label: known.label, terms: known.terms };
  const partial = GRADER_TRADES.find((trade) => trade.terms.some((term) => lower.includes(term)) || lower.includes(trade.key));
  const words = lower
    .split(/[^a-z0-9/]+/)
    .filter((word) => word.length >= 3 && !STOP.has(word));
  const terms = Array.from(new Set([lower, ...words, ...(partial ? partial.terms : [])])).filter(Boolean);
  return { label: raw, terms };
}

/** Lets the question checks phrase themselves naturally: "an HVAC company", "a plumber". */
export function tradeNoun(label: string) {
  const lower = label.toLowerCase();
  if (lower.startsWith('hvac')) return 'HVAC company';
  if (lower.startsWith('plumb')) return 'plumber';
  if (lower.startsWith('roof')) return 'roofer';
  if (lower.startsWith('lawn')) return 'lawn care company';
  if (lower.startsWith('house clean') || lower === 'cleaning') return 'house cleaner';
  if (lower.startsWith('electric')) return 'electrician';
  if (lower.startsWith('pest')) return 'pest control company';
  if (lower.startsWith('pressure')) return 'pressure washing company';
  if (lower.startsWith('paint')) return 'painter';
  if (lower.startsWith('garage')) return 'garage door company';
  if (lower.startsWith('tree')) return 'tree service';
  if (lower.startsWith('pool')) return 'pool service';
  if (lower.startsWith('marketing')) return 'marketing agency';
  return `${label} company`;
}
