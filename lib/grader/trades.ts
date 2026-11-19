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
  { key: 'dental', label: 'Dentist / dental office', terms: ['dentist', 'dental', 'dentistry', 'teeth', 'orthodont'] },
  { key: 'law', label: 'Law firm / attorney', terms: ['attorney', 'lawyer', 'law firm', 'legal', 'law office'] },
  { key: 'salon', label: 'Hair salon / barber', terms: ['salon', 'hair', 'barber', 'stylist', 'haircut'] },
  { key: 'auto-repair', label: 'Auto repair', terms: ['auto repair', 'mechanic', 'brakes', 'oil change', 'automotive', 'car repair'] },
  { key: 'med-spa', label: 'Med spa', terms: ['med spa', 'medspa', 'botox', 'filler', 'aesthetics', 'facial'] },
  { key: 'real-estate', label: 'Real estate agent', terms: ['realtor', 'real estate', 'homes for sale'] },
  { key: 'restaurant', label: 'Restaurant', terms: ['restaurant', 'menu', 'dine', 'takeout', 'catering'] },
  { key: 'chiropractor', label: 'Chiropractor', terms: ['chiropractor', 'chiropractic', 'back pain'] },
  { key: 'veterinarian', label: 'Veterinarian', terms: ['veterinarian', 'vet', 'animal hospital', 'pet care'] },
  { key: 'accountant', label: 'Accountant / CPA', terms: ['accountant', 'cpa', 'tax', 'bookkeeping', 'accounting'] },
  { key: 'insurance', label: 'Insurance agency', terms: ['insurance', 'insurance agent', 'insurance agency'] },
  { key: 'gym', label: 'Gym / fitness', terms: ['gym', 'fitness', 'personal training', 'workout'] },
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
  if (lower.startsWith('dent')) return 'dentist';
  if (lower.startsWith('law') || lower.startsWith('attorney') || lower.startsWith('lawyer')) return 'lawyer';
  if (lower.startsWith('hair') || lower.startsWith('salon')) return 'hair salon';
  if (lower.startsWith('barber')) return 'barber';
  if (lower.startsWith('auto')) return 'car repair shop';
  if (lower.startsWith('med spa') || lower.startsWith('medspa')) return 'med spa';
  if (lower.startsWith('real estate') || lower.startsWith('realtor')) return 'real estate agent';
  if (lower.startsWith('restaurant')) return 'restaurant';
  if (lower.startsWith('chiro')) return 'chiropractor';
  if (lower.startsWith('vet')) return 'veterinarian';
  if (lower.startsWith('accountant') || lower.startsWith('cpa')) return 'CPA';
  if (lower.startsWith('insurance')) return 'local insurance agent';
  if (lower.startsWith('gym') || lower.startsWith('fitness')) return 'gym';
  return `${label} company`;
}
