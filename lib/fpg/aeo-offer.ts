/**
 * Locked Front Porch Growth AI Search Visibility offer (Cole, Nov 25–26, 2026).
 * Source of truth for live-site prices, terms and guarantee copy.
 * Never put "ChatGPT" in a product name, plan name or page title.
 */

export const CITATION_SPRINT_PAYMENT_URL = 'https://buy.stripe.com/00wfZj2Vg68l05Hbus0Ba0k';

export const AEO_PRICES = {
  sprint: 497,
  found: 1997,
  recommended: 3497,
  marketLeader: 6997,
  foundSetup: 750,
  recommendedSetup: 1250,
  marketLeaderSetup: 2500,
  pwnSetup: 497,
  pwnFound: 2297,
  pwnRecommended: 3797,
  extraLocationFoundRec: 500,
  extraLocationMarketLeader: 1500,
} as const;

export const AEO_PRICE_LABELS = {
  sprint: '$497',
  found: '$1,997',
  recommended: '$3,497',
  marketLeader: '$6,997+',
  foundSetup: '$750',
  recommendedSetup: '$1,250',
  marketLeaderSetup: '$2,500',
  pwnSetup: '$497',
  pwnFound: '$2,297',
  pwnRecommended: '$3,797',
} as const;

/** Short ladder used in comparison rows and nav. */
export const AEO_LADDER_SHORT = 'Free Gap Report · $497 Sprint · from $1,997/mo';

/** Meta / OG line. Keep <= 155 characters when used as a description. */
export const AEO_SEO_DESCRIPTION =
  'Get named in ChatGPT, Google AI Overviews and Perplexity: trades, dental, med spa, law, B2B. Free Gap Report. Plans from $1,997/mo.';

export const GUARANTEE_HEADLINE = 'Named in ChatGPT or Google AI Overviews, or we work free until you are.';

export const GUARANTEE_SHORT =
  'By day 90 you’re named in at least 3 of your 10 money questions on Found, 4 on Recommended, or 5 on Market Leader (per market) in ChatGPT or Google AI Overviews, or we work free (up to 90 more days, then your last month back). Visibility only; never calls, cases, patients or revenue.';

export const GUARANTEE_BODY =
  'In week 1 we agree on your 10 money questions: the questions your buyers actually ask, like “best plumber in Gadsden AL.” By day 90, you’ll be named in at least 3 of those 10 questions in ChatGPT or Google AI Overviews on Found, 4 on Recommended, or 5 on Market Leader (per market). If you’re not, we keep working free until you are, for up to 90 more days. If we still haven’t hit it, we refund your last paid month. This guarantee covers AI visibility only. It never covers calls, leads, cases, patients, bookings or revenue, and we never promise a #1 spot. Full terms are in your agreement.';

export const GUARANTEE_LINE_FOUND =
  'By day 90 you’re named in at least 3 of your 10 money questions in ChatGPT or Google AI Overviews, or we work free (up to 90 more days, then your last month back). Visibility only; never calls, cases, patients or revenue.';

export const GUARANTEE_LINE_RECOMMENDED =
  'By day 90 you’re named in at least 4 of your 10 money questions in ChatGPT or Google AI Overviews, or we work free (up to 90 more days, then your last month back). Visibility only; never calls, cases, patients or revenue.';

export const GUARANTEE_LINE_MARKET_LEADER =
  'By day 90 you’re named in at least 5 of your 10 money questions per market in ChatGPT or Google AI Overviews, or we work free (up to 90 more days, then your last month back). Visibility only; never calls, cases, patients or revenue.';

export const GUARANTEE_FAQ = GUARANTEE_BODY;

export const GUARANTEE_REGULATED =
  'Visibility and deliverables only. No outcome promises. In week 1 we agree on your 10 money questions. By day 90 you’ll be named in at least 3 of them on Found, 4 on Recommended, or 5 on Market Leader in ChatGPT or Google AI Overviews, or we keep working free for up to 90 more days, then refund your last paid month. We also promise every listed monthly deliverable; miss one and that month is 50% off. We don’t promise patients, cases, treatments, case results or revenue, and every piece of content is approved by your designated compliance approver before it’s published. Full terms are in your agreement.';

export const SETUP_WAIVERS =
  'Setup is waived with a 6-month first term on Found or Recommended, a 12-month first term on Market Leader, if you prepay the first term, or $497 off if you bought the Citation Sprint in the last 30 days.';

export const AEO_PRICES_SENTENCE =
  'Front Porch Growth’s published prices: a free Competitor Gap Report, a $497 Citation Sprint (one time, credited to the setup fee if you start a monthly plan within 30 days), Found at $1,997 a month plus $750 setup (90-day first term), Recommended at $3,497 a month plus $1,250 setup (90-day first term), and Market Leader from $6,997 a month plus $2,500 setup (6-month first term), or Pay When Named ($497 setup, then $2,297 or $3,797 a month once named). Setup is waived with a 6-month term on Found or Recommended, a 12-month term on Market Leader, or if you prepay the first term.';

export const AEO_PRICES_FOOTER =
  'Published prices: free Gap Report, $497 Citation Sprint, Found $1,997/mo plus $750 setup (90-day first term), Recommended $3,497/mo plus $1,250 setup (90-day first term), Market Leader from $6,997/mo plus $2,500 setup (6-month first term), or Pay When Named. Monthly plans carry a visibility guarantee and a report every Friday.';

export const PWN_BODY =
  'On Found or Recommended, pay the $497 setup, then nothing monthly until you are named on 3 of your 10 money questions in our logged checks for two consecutive weekly runs. Then Found is $2,297 a month and Recommended is $3,797, with a 3-month minimum. If it has not happened by day 90, you owe nothing more and keep everything we built. Limited spots each month.';

export const SPRINT_CREDIT_LINE =
  '100% credited toward your setup fee if you start a monthly plan within 30 days.';

export const NO_PROMISE_TRADES = {
  q: 'Can you guarantee AI will name my shop?',
  a: 'No one can promise a single AI answer; they change from one run to the next. Monthly plans promise a visibility number: by day 90 you’re named in at least 3 of your 10 money questions on Found, 4 on Recommended, or 5 on Market Leader (per market) in ChatGPT or Google AI Overviews. If not, we work free for up to 90 more days, then refund your last paid month. This covers visibility only — never calls, leads, cases, patients, bookings or revenue — and we never promise a #1 spot. Full terms are in your agreement. Pay When Named lets you skip the monthly bill until you are named.',
};

export const MONTHLY_OFFERS: Array<{ name: string; price: number }> = [
  { name: 'Found', price: AEO_PRICES.found },
  { name: 'Recommended', price: AEO_PRICES.recommended },
  { name: 'Market Leader', price: AEO_PRICES.marketLeader },
];
