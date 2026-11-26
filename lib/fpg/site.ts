/**
 * Front Porch Growth site map: nav, footer columns, services, industries, free tools.
 * Front Porch Growth sells marketing services. The AI receptionist (Ava) lives only on
 * executivereceptionist.com, so receptionist links here always point there.
 */
import { POSTCARD_TRADES } from '@/lib/postcards/trade-pages';
import { TRADE_PAGES } from '@/lib/trades/pages';

export const FPG_PUBLIC_PHONE = '(256) 595-3354';
export const FPG_PUBLIC_PHONE_HREF = 'tel:+12565953354';
export const ER_HOME = 'https://executivereceptionist.com/';
export const ER_PRICING = 'https://executivereceptionist.com/pricing';
export const ER_COMPARE = 'https://executivereceptionist.com/compare';

export type FpgLink = { href: string; label: string; detail?: string };

export const FPG_SERVICES: Array<FpgLink & { price: string }> = [
  {
    href: '/ai-search-visibility',
    label: 'AI Search Visibility',
    price: 'Free Gap Report · $497 Sprint · from $1,997/mo',
    detail: 'Done-for-you work so ChatGPT, Google AI Overviews and Perplexity can find and cite your shop. Roofing first.',
  },
  {
    href: '/postcards',
    label: 'YardMailer postcards',
    price: '$127 setup once, then $3.54 (4×6) or $4.95 (6×9) per card',
    detail: 'A card that shows the homeowner a concept for their own property, with a QR code to request an estimate.',
  },
  {
    href: '/google-profile',
    label: 'Google Business Profile setup',
    price: '$99 one time',
    detail: 'Categories, services, description, photos, hours and service area set up right, once.',
  },
  {
    href: '/reputation',
    label: 'Review requests',
    price: 'Free starter or $20/mo on ReputationFlow',
    detail: 'One public review link and QR code for every customer. No review gating.',
  },
  {
    href: '/leads',
    label: 'Business lead lists',
    price: 'From $20, one time',
    detail: 'A spreadsheet of businesses in the industry you sell to, with the email each one publishes.',
  },
];

export const FPG_FREE_TOOLS: FpgLink[] = [
  { href: '/ai-visibility', label: 'SEO & AI visibility grader', detail: 'Score what search engines and AI assistants can read on your site.' },
  { href: '/free-tools/postcard-cost-calculator', label: 'Postcard campaign cost calculator', detail: 'Exact YardMailer cost for any quantity, next to the do-it-yourself postage line.' },
  { href: '/free-tools/postcard-roi-calculator', label: 'Postcard break-even calculator', detail: 'How many jobs a mailing has to win to pay for itself, using your own numbers.' },
  { href: '/lead-scout', label: 'Lead Scout', detail: 'Search public Google listings by trade and city. It contacts no one.' },
  { href: '/agents', label: 'Writing agents', detail: 'Draft estimates, review replies, job ads and service pages. Nothing is sent.' },
];

export type FpgCompareLink = FpgLink & { group: 'Google profile & local SEO' | 'Postcards' | 'AI search' | 'Reviews' };

export const FPG_COMPARE_LINKS: FpgCompareLink[] = [
  { href: '/compare/front-porch-growth-vs-local-seo-bot', label: 'vs Local SEO Bot', group: 'Google profile & local SEO' },
  { href: '/compare/front-porch-growth-vs-brightlocal', label: 'vs BrightLocal', group: 'Google profile & local SEO' },
  { href: '/compare/yardmailer-vs-postcardmania', label: 'YardMailer vs PostcardMania', group: 'Postcards' },
  { href: '/compare/yardmailer-vs-eddm', label: 'YardMailer vs USPS EDDM', group: 'Postcards' },
  { href: '/compare/front-porch-growth-vs-aeo-engine', label: 'vs AEO Engine', group: 'AI search' },
  { href: '/compare/front-porch-growth-vs-otterly', label: 'vs Otterly.ai', group: 'AI search' },
  { href: '/compare/front-porch-growth-vs-nicejob', label: 'vs NiceJob', group: 'Reviews' },
];

export function fpgIndustries(): FpgLink[] {
  return [
    ...POSTCARD_TRADES.map((trade) => ({ href: `/postcards/${trade.slug}`, label: `Postcards for ${trade.plural}` })),
    ...TRADE_PAGES.map((page) => ({ href: `/trades/${page.slug}`, label: `${page.name}: growth tools` })),
  ];
}

export const FPG_NAV: FpgLink[] = [
  { href: '/#services', label: 'Services' },
  { href: '/trades', label: 'Industries' },
  { href: '/compare', label: 'Compare' },
  { href: '/free-tools', label: 'Free tools' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Guides' },
  { href: ER_HOME, label: 'AI receptionist ↗' },
];

export function fpgFooterColumns(): Array<{ title: string; links: FpgLink[] }> {
  return [
    {
      title: 'Services',
      links: [
        ...FPG_SERVICES.map(({ href, label }) => ({ href, label })),
        { href: '/missed-call', label: 'Missed-call text-back (waitlist)' },
        { href: '/pricing', label: 'Pricing' },
      ],
    },
    {
      title: 'Industries',
      links: [{ href: '/trades', label: 'All industries' }, ...fpgIndustries().slice(0, 10)],
    },
    {
      title: 'Compare',
      links: [{ href: '/compare', label: 'All comparisons' }, ...FPG_COMPARE_LINKS.map(({ href, label }) => ({ href, label }))],
    },
    {
      title: 'Free tools',
      links: [{ href: '/free-tools', label: 'All free tools' }, ...FPG_FREE_TOOLS.map(({ href, label }) => ({ href, label }))],
    },
    {
      title: 'Company',
      links: [
        { href: '/about', label: 'About' },
        { href: '/blog', label: 'Guides' },
        { href: ER_HOME, label: 'Executive Receptionist (AI receptionist)' },
        { href: '/login?next=/desk', label: 'Sign in' },
        { href: '/terms', label: 'Terms' },
        { href: '/privacy', label: 'Privacy' },
        { href: '/sms', label: 'SMS terms' },
        { href: '/sms-consent', label: 'SMS consent' },
        { href: '/llms.txt', label: 'For AI assistants (llms.txt)' },
      ],
    },
  ];
}
