const TRADES = [
  'plumber',
  'hvac',
  'roofer',
  'lawn care',
  'house cleaner',
  'electrician',
  'pest control',
  'painter',
  'property manager',
] as const;

export type LeadScoutTrade = (typeof TRADES)[number];

export const LEAD_SCOUT_TRADES: LeadScoutTrade[] = [...TRADES];

export function readLeadScoutQuery(input: { trade?: unknown; city?: unknown }): { ok: true; trade: string; city: string } | { ok: false; error: string } {
  const trade = typeof input.trade === 'string' ? input.trade.trim().toLowerCase() : '';
  const city = typeof input.city === 'string' ? input.city.replace(/\s+/g, ' ').trim() : '';
  if (!LEAD_SCOUT_TRADES.includes(trade as LeadScoutTrade)) {
    return { ok: false, error: 'Choose a trade from the list.' };
  }
  if (city.length < 2 || city.length > 80) {
    return { ok: false, error: 'Enter a city, between 2 and 80 characters.' };
  }
  if (!/^[\p{L}\p{N}\s,.'-]+$/u.test(city)) {
    return { ok: false, error: 'Use letters in the city name.' };
  }
  return { ok: true, trade, city };
}
