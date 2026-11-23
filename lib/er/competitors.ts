/**
 * Ava vs other receptionists. Every competitor price below was read from that company's own
 * pricing page on PRICES_CHECKED (late evening, Central time). Re-check before changing copy.
 * Only Executive Receptionist features that work in production are claimed for Ava.
 */
export const PRICES_CHECKED = '2026-11-22';
export const PRICES_CHECKED_LABEL = 'November 22, 2026';

export type CompetitorPlan = { name: string; price: string; includes: string };

export type Competitor = {
  slug: string;
  name: string;
  kind: 'AI receptionist' | 'Live receptionists' | 'Phone system with an AI agent';
  oneLine: string;
  metaTitle: string;
  description: string;
  plans: CompetitorPlan[];
  billing: string;
  overage: string;
  trial: string;
  example: string;
  theyWin: string[];
  avaWins: string[];
  sourceUrl: string;
  sourceLabel: string;
  faqs: { q: string; a: string }[];
};

export const AVA_FACTS = {
  plans: [
    { name: 'Starter', price: '$79/month ($1 first month)', includes: '100 minutes' },
    { name: 'Growth', price: '$197/month', includes: '300 minutes' },
    { name: 'Pro', price: '$397/month', includes: '1,200 minutes' },
    { name: 'Elite', price: '$789/month', includes: '2,000 minutes, priority setup' },
  ],
  billing: 'Flat monthly plan by included minutes. Month to month.',
  overage: 'Overflow ($25, 60 minutes) bills $1/min after 60. Starter and up have no per-minute overage. Past your minutes Ava keeps answering and we reach out about a bigger plan.',
  trial: 'Starter is $1 for the first month. Call the demo line any time.',
  rows: [
    ['Answers 24/7', 'Yes, on the calls you forward'],
    ['Says it is AI', 'Yes, in the greeting'],
    ['Spanish', 'Switches when the caller does'],
    ['Call summary', 'Emailed after every call, plus your Desk call log'],
    ['Booking', 'Into your Desk calendar once your hours are set there'],
    ['Setup', 'Done for you from your website and notes; you forward your line'],
  ] as [string, string][],
};

export const COMPETITORS: Competitor[] = [
  {
    slug: 'ava-vs-smith-ai',
    name: 'Smith.ai',
    kind: 'AI receptionist',
    oneLine: 'Smith.ai sells an AI receptionist billed per call and a separate staffed receptionist service.',
    metaTitle: 'Ava vs Smith.ai: AI Receptionist Price Comparison',
    description: `Ava vs Smith.ai, with prices from Smith.ai's own pricing pages checked ${PRICES_CHECKED_LABEL}. Per-call AI and staffed plans vs Ava's flat monthly minutes.`,
    plans: [
      { name: 'AI Receptionist Free', price: '$0/month', includes: '25 calls a month' },
      { name: 'AI Receptionist Pro', price: '$150/month', includes: '75 calls ($2.00 a call); larger steps at $270 (150 calls), $500 (300), $800 (500)' },
      { name: 'Virtual receptionists (people)', price: '$300 / $810 / $2,100 a month', includes: '30 / 90 / 300 calls; $11.50 / $10.50 / $8.50 per extra call' },
    ],
    billing: 'Per call. The AI plans list an extra-call rate from $3.00 down to $2.10.',
    overage: 'Extra AI calls are $3.00 each on the $150 plan, per Smith.ai’s feature table.',
    trial: 'Free AI tier with 25 calls a month. Staffed plans list a 30-day money-back guarantee.',
    example:
      'Example: 100 calls a month. Smith.ai AI Pro is $150 for 75 calls plus 25 extra at $3.00, about $225. The staffed plan is $810 for 90 calls plus 10 at $10.50, about $915. Ava Growth is $197 for 300 minutes, which is about 100 three-minute calls.',
    theyWin: [
      'A free tier you can test on real calls.',
      'Staffed receptionists and AI-to-human transfer if you want a person on the line.',
      'Published CRM integrations.',
    ],
    avaWins: [
      'Billed by minutes on a flat plan, with no per-call overage charge.',
      'A trade-specific demo you can call right now at (256) 952-4935.',
      'Setup is done for you from your website and a few notes.',
    ],
    sourceUrl: 'https://smith.ai/pricing/ai-receptionist',
    sourceLabel: 'smith.ai/pricing/ai-receptionist and smith.ai/pricing/receptionists',
    faqs: [
      {
        q: 'Is Ava cheaper than Smith.ai?',
        a: 'It depends on volume. At about 100 calls a month, Smith.ai’s AI plan works out near $225 and Ava Growth is $197. Smith.ai’s free tier is cheaper if you get fewer than 25 calls a month.',
      },
      {
        q: 'Does Ava transfer calls to a live person like Smith.ai?',
        a: 'Ava is not a staffed service. She takes the details and emails you a summary so you can call back.',
      },
    ],
  },
  {
    slug: 'ava-vs-ruby',
    name: 'Ruby',
    kind: 'Live receptionists',
    oneLine: 'Ruby is a staffed virtual receptionist service billed by the minute.',
    metaTitle: 'Ava vs Ruby Receptionist: Price and Features',
    description: `Ava vs Ruby, with Ruby’s plan prices from ruby.com checked ${PRICES_CHECKED_LABEL}. Live receptionist minutes vs a flat-priced AI receptionist.`,
    plans: [
      { name: '50 minutes', price: '$250/month', includes: 'Live receptionists' },
      { name: '100 minutes', price: '$395/month', includes: 'Live receptionists' },
      { name: '200 minutes', price: '$720/month', includes: 'Live receptionists' },
      { name: '500 minutes', price: '$1,725/month', includes: 'Live receptionists' },
    ],
    billing: 'Per receptionist minute, by plan.',
    overage: 'Ruby’s plans page did not show an overage rate in its text when checked.',
    trial: 'Ruby’s plans page asks you to talk to sales to build a plan.',
    example:
      'Example: 300 minutes a month. Ruby’s 200-minute plan is $720 and the 500-minute plan is $1,725. Ava Growth is $197 for 300 minutes.',
    theyWin: ['A real person answers every call.', 'Live website chat plans.', 'Long track record as a staffed service.'],
    avaWins: [
      'A fraction of the per-minute price: Ava Growth is about $0.66 a minute included.',
      'No per-minute overage charge on Starter and up.',
      'Nights, weekends and holidays at the same flat monthly price.',
    ],
    sourceUrl: 'https://www.ruby.com/plans-and-pricing/',
    sourceLabel: 'ruby.com/plans-and-pricing',
    faqs: [
      {
        q: 'Why is Ruby more expensive than Ava?',
        a: 'Ruby is staffed by people, so it bills by the minute of a person’s time. Ava is software on a flat monthly plan.',
      },
      {
        q: 'Should I pick a person or an AI?',
        a: 'If every caller must reach a human, a staffed service fits. If you mainly need every call answered and the details written down, an AI receptionist costs less.',
      },
    ],
  },
  {
    slug: 'ava-vs-goodcall',
    name: 'Goodcall',
    kind: 'AI receptionist',
    oneLine: 'Goodcall bills its AI phone agent per unique caller each month, not per minute.',
    metaTitle: 'Ava vs Goodcall: AI Answering Service Comparison',
    description: `Ava vs Goodcall, with Goodcall’s prices from its own pricing page checked ${PRICES_CHECKED_LABEL}. Per-customer billing vs Ava’s flat monthly minutes.`,
    plans: [
      { name: 'Starter', price: '$79/month', includes: '100 unique customers, then 79¢ each' },
      { name: 'Growth', price: '$129/month', includes: '500 unique customers, then 26¢ each' },
      { name: 'Scale', price: '$299/month', includes: '2,000 unique customers, then 15¢ each' },
    ],
    billing: 'Per unique caller per month. Minutes are not metered.',
    overage: 'Extra customers bill at the plan rate (79¢, 26¢ or 15¢).',
    trial: 'Goodcall says you can start free with a demo agent.',
    example:
      'Example: 100 calls a month from about 80 different people. Goodcall Starter is $79. Ava Starter is $79 after a $1 first month, but includes 100 minutes, so a busy line would move up to Growth at $197.',
    theyWin: ['Unmetered minutes, so long calls cost nothing extra.', 'Lower price at higher call volume.', 'Self-serve agent editing.'],
    avaWins: [
      'Setup done for you, with a greeting and intake questions written for your trade.',
      'A callable demo shop at (256) 952-4935 before you pay.',
      'Starter’s first month is $1.',
    ],
    sourceUrl: 'https://www.goodcall.com/pricing',
    sourceLabel: 'goodcall.com/pricing',
    faqs: [
      {
        q: 'Is Goodcall cheaper than Ava?',
        a: 'Often, yes, at high volume. Goodcall’s Growth plan is $129 for 500 unique customers. Ava’s advantage is done-for-you setup for trade shops, not the lowest price.',
      },
    ],
  },
  {
    slug: 'ava-vs-rosie',
    name: 'Rosie',
    kind: 'AI receptionist',
    oneLine: 'Rosie is a self-serve AI answering service with minute-based monthly plans.',
    metaTitle: 'Ava vs Rosie AI: Answering Service Comparison',
    description: `Ava vs Rosie, with Rosie’s monthly prices from heyrosie.com checked ${PRICES_CHECKED_LABEL}. What each plan includes and who each one fits.`,
    plans: [
      { name: 'Professional', price: '$49/month', includes: '250 minutes' },
      { name: 'Scale', price: '$149/month', includes: '1,000 minutes' },
      { name: 'Growth', price: '$299/month', includes: '2,000 minutes' },
    ],
    billing: 'Monthly plan by minutes. Annual billing gives two months free.',
    overage: 'Rosie’s pricing page lists the question but its answer was not readable in the page text when checked.',
    trial: '7-day free trial.',
    example:
      'Example: 300 minutes a month. Rosie Scale is $149 for 1,000 minutes. Ava Growth is $197 for 300 minutes.',
    theyWin: ['Lower price per minute.', 'Mobile apps.', 'Transfers and in-call texting on higher plans.'],
    avaWins: [
      'Setup written for you by Cole from your website and notes, not a do-it-yourself build.',
      'Trade-specific intake questions for HVAC, plumbing, roofing and more.',
      'A $1 first month on Starter.',
    ],
    sourceUrl: 'https://heyrosie.com/pricing',
    sourceLabel: 'heyrosie.com/pricing',
    faqs: [
      {
        q: 'Is Rosie cheaper than Ava?',
        a: 'Yes, per minute. Rosie Professional is $49 for 250 minutes. Ava costs more because setup is done for you and the script is written for your trade.',
      },
    ],
  },
  {
    slug: 'ava-vs-my-ai-front-desk',
    name: 'My AI Front Desk',
    kind: 'AI receptionist',
    oneLine: 'My AI Front Desk (Frontdesk) bundles AI call answering with chat, CRM and automations.',
    metaTitle: 'Ava vs My AI Front Desk: Price Comparison',
    description: `Ava vs My AI Front Desk, with Frontdesk’s prices from its own pricing page checked ${PRICES_CHECKED_LABEL}. Minutes, overage credits, and who each fits.`,
    plans: [
      { name: 'Business-in-a-Box', price: '$99/month ($79/month billed annually)', includes: '200 voice minutes plus chat, CRM and automations' },
      { name: 'Partner / Enterprise', price: 'Custom', includes: 'Volume pricing' },
    ],
    billing: 'Monthly or annual plan with included voice minutes.',
    overage: 'Overage credits: 1,000 included, then $10 per 1,000 credits on auto-reload.',
    trial: '7-day free trial.',
    example:
      'Example: 300 minutes a month. Frontdesk is $99 for 200 minutes, with the rest drawn from overage credits. Ava Growth is $197 for 300 minutes with no overage charge.',
    theyWin: ['More tools in one plan, such as web chat and a CRM.', 'Lower entry price.', 'Annual discount.'],
    avaWins: ['No overage credits to track; one flat monthly price.', 'Setup done for you.', 'Built around trade calls, with a callable demo shop.'],
    sourceUrl: 'https://www.myaifrontdesk.com/pricing',
    sourceLabel: 'myaifrontdesk.com/pricing',
    faqs: [
      {
        q: 'Which is simpler to budget?',
        a: 'Ava bills one flat monthly price with no overage charge. Frontdesk includes 200 minutes and then draws on overage credits.',
      },
    ],
  },
  {
    slug: 'ava-vs-quo-sona',
    name: 'Quo Sona',
    kind: 'Phone system with an AI agent',
    oneLine: 'Quo (formerly OpenPhone) is a business phone system; its AI agent, Sona, is billed in credits.',
    metaTitle: 'Ava vs Quo Sona (OpenPhone AI): Price Comparison',
    description: `Ava vs Quo’s Sona AI agent, with prices from quo.com/pricing checked ${PRICES_CHECKED_LABEL}. Per-user phone plans plus AI credits vs Ava’s flat plans.`,
    plans: [
      { name: 'Quo phone plans', price: '$19 / $33 / $47 per user a month', includes: '$15 / $23 / $35 billed yearly' },
      { name: 'Sona credits', price: '$0 / $25 / $49 / $99 / $199 a month', includes: '10 / 40 / 100 / 250 / 600 AI calls' },
    ],
    billing: 'Per user for the phone system, plus monthly AI credit tiers.',
    overage: 'Extra AI calls from $1.00 down to $0.45 each. Calls under 15 seconds use no credits.',
    trial: '7-day free trial. Every plan includes 10 AI calls.',
    example:
      'Example: one user and 100 AI-answered calls. Quo Starter at $19 plus the $49 credit tier is about $68 a month. Ava Growth is $197 for 300 minutes.',
    theyWin: ['A full business phone system with texting and shared numbers.', 'Lower price if you also need a new phone system.', 'Many integrations.'],
    avaWins: [
      'Keep your current number and carrier; you just forward calls to Ava.',
      'One flat bill, no credits to track.',
      'Setup and trade scripts done for you.',
    ],
    sourceUrl: 'https://www.quo.com/pricing',
    sourceLabel: 'quo.com/pricing',
    faqs: [
      {
        q: 'Do I need to switch phone systems to use Ava?',
        a: 'No. You keep your number and forward the calls you want Ava to take, all of them or only the missed ones.',
      },
    ],
  },
];

export function getCompetitor(slug: string) {
  return COMPETITORS.find((c) => c.slug === slug);
}
