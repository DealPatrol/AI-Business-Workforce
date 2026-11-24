/**
 * "Never Miss + Get Found": Ava plus done-for-you Google Business Profile work for
 * Gadsden / Etowah County home-service trades. Proposed Nov 24, 2026; prices need Cole's
 * approval and Stripe prices do not exist yet, so the page has no checkout buttons.
 *
 * Copy rules: Ava answers 24/7, takes the caller's details, flags emergencies and emails a
 * summary. No texting, live transfer, calendar sync, appointment booking or in-person setup
 * claims, and no ranking or AI-citation promises.
 */
export type GetFoundTierKey = 'starter' | 'core' | 'fullShop';

export type GetFoundTier = {
  key: GetFoundTierKey;
  name: string;
  monthlyCents: number;
  monthlyLabel: string;
  setupLabel: string;
  minutesLabel: string;
  badge: string;
  featured: boolean;
  blurb: string;
  features: string[];
  guarantees: string[];
};

export const GET_FOUND_TIERS: GetFoundTier[] = [
  {
    key: 'starter',
    name: 'Get Found Starter',
    monthlyCents: 29700,
    monthlyLabel: '$297',
    setupLabel: '$197 one-time setup',
    minutesLabel: '300 minutes of Ava a month',
    badge: '',
    featured: false,
    blurb: 'For a one-truck or two-truck shop that needs the phone covered and a Google profile that looks alive.',
    features: [
      '300 minutes of Ava answering a month, 24/7',
      'Caller name, number, address and problem emailed to you after every call',
      '3 Google posts a week from your real jobs and photos',
      'A reply to every new Google review within 2 business days',
      'Google profile tune-up at setup, then a monthly check',
      'AI search check every quarter (5 questions)',
      'Weekly missed-calls report and a monthly one-page report',
    ],
    guarantees: ['Catch 5 or month two is free'],
  },
  {
    key: 'core',
    name: 'Never Miss + Get Found',
    monthlyCents: 49700,
    monthlyLabel: '$497',
    setupLabel: '$297 one-time setup',
    minutesLabel: '1,200 minutes of Ava a month',
    badge: 'Most shops pick this',
    featured: true,
    blurb: 'For a busy shop whose phone rings all day and whose next customer is searching Google tonight.',
    features: [
      '1,200 minutes of Ava answering a month, 24/7',
      'Caller name, number, address and problem emailed to you after every call',
      '3 Google posts a week from your real jobs and photos',
      'A reply to every new Google review within 1 business day',
      'Google profile tune-up at setup, then a monthly check',
      'AI search check every month (5 questions) and a listings report',
      '5 FAQ answers written for your website',
      'Weekly missed-calls report and a monthly one-page report',
    ],
    guarantees: ['Catch 5 or month two is free', '20% more Google calls in 90 days or month four is free'],
  },
  {
    key: 'fullShop',
    name: 'Full Shop + Get Found',
    monthlyCents: 99700,
    monthlyLabel: '$997',
    setupLabel: 'Setup included',
    minutesLabel: '2,000 minutes of Ava a month',
    badge: '',
    featured: false,
    blurb: 'For a multi-trade shop, a second location, or an owner who wants the whole front door handled.',
    features: [
      '2,000 minutes of Ava answering a month, 24/7, for every trade you run',
      'A second line or location',
      'A morning callback list of every lead, sorted by urgency',
      'Weekly script tuning from your real calls',
      '3 Google posts a week plus a monthly offer or event post',
      'A reply to every new Google review within 1 business day',
      'AI search check every month (10 questions), and we fix the listings we can access',
      '10 FAQ answers for your website, refreshed every quarter',
      'Quarterly review call with Cole',
    ],
    guarantees: ['Catch 5 or month two is free', '20% more Google calls in 90 days or month four is free'],
  },
];

export const GET_FOUND_AREA = [
  'Gadsden',
  'Rainbow City',
  'Southside',
  'Attalla',
  'Glencoe',
  'Hokes Bluff',
  'Boaz',
  'Albertville',
] as const;

export const GET_FOUND_TRADES = ['HVAC', 'Plumbing', 'Electrical', 'Roofing', 'Septic', 'Other trade'] as const;

/** Plain-language guarantee terms. Mirrors /workspace/never-miss-a-job/gbp-package/package.md §3. */
export const GET_FOUND_GUARANTEES = {
  catchFive:
    'If Ava doesn’t catch at least 5 missed calls that turn into real leads in your first 30 days, month two is free. A missed call means after hours, or when you didn’t answer or the line was busy, from a real customer in your area who needs a service you offer and left a callback number. Spam, vendors, wrong numbers and repeat calls from the same number within 7 days don’t count, and spam minutes are credited back. Your forwarding has to stay on for the 30 days.',
  twentyPercent:
    'If calls from your Google Business Profile in your first 90 days aren’t at least 20% higher than your baseline, month four is free and we keep working. We use Google’s own number: Calls in your profile’s Performance report, which you can check yourself. The baseline is the same 90 days last year. If Google has no data for last year, it’s the 90 days before you start. If either window has fewer than 30 calls, or your profile is under 6 months old, the baseline is your first 14 days with us scaled up to 90 days, and we measure days 15 to 104. We send you the baseline screenshot before we change anything.',
  conditions: [
    'You add us as a Manager on your Google profile (you stay the owner).',
    'The phone number on your profile stays the same, and the profile isn’t marked closed for more than 7 days.',
    'Nobody else is posting to or editing your profile during the 90 days.',
    'You answer our approval emails within 3 business days and send a few real job photos each month.',
    'Your account is paid up. One free month per guarantee.',
  ],
} as const;
