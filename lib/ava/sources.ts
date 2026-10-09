/** Cited figures only. Do not invent close rates or "studies" beside these. */
export const BLS_RECEPTIONIST = {
  name: 'U.S. Bureau of Labor Statistics, Occupational Outlook Handbook, Receptionists',
  medianAnnual: 37230,
  medianHourly: 17.9,
  period: 'May 2024',
  url: 'https://www.bls.gov/ooh/office-and-administrative-support/receptionists.htm',
} as const;

export const GOOGLE_NEARBY_SEARCH = {
  name: 'Google and Purchased, How Mobile Search Connects Consumers to Stores',
  period: 'May 2016',
  url: 'https://www.thinkwithgoogle.com/_qs/documents/620/mobile-search-trends-consumers-to-stores.pdf',
  summary:
    'In that smartphone diary, 76% of people who searched for something nearby visited a business within a day, and 28% of those nearby searches resulted in a purchase. The study is about nearby search in general, not home-service close rates or phone answer rates.',
} as const;

export function receptionistMonthlyWage() {
  return Math.round(BLS_RECEPTIONIST.medianAnnual / 12);
}
