import { POSTCARD_SETUP_LABEL, POSTCARD_SIZES, postcardPackageRows } from '@/lib/postcards/pricing';

export type Row = { product: string; href: string; what: string; price: string; billing: string };

export function fpgPriceRowsData(): Row[] {
  return [
    { product: 'AI Competitor Gap Report', href: '/ai-search-visibility', what: 'Who AI names in your town, and your 5 biggest gaps', price: 'Free', billing: 'No card' },
    { product: 'AI Citation Sprint', href: '/ai-search-visibility', what: 'Baseline citation report, 1 answer-first page, schema on 2 pages', price: '$497', billing: 'One time; credited to the setup fee if you start a plan within 30 days' },
    { product: 'AI Search Visibility: Found', href: '/ai-search-visibility', what: 'One location, one metro; weekly checks and Friday report; 90-day first term', price: '$1,997/mo + $750 setup', billing: 'Monthly after setup' },
    { product: 'AI Search Visibility: Recommended', href: '/ai-search-visibility', what: '2–4 towns, one business per field per town; YouTube and LinkedIn; 90-day first term', price: '$3,497/mo + $1,250 setup', billing: 'Monthly after setup' },
    { product: 'AI Search Visibility: Market Leader', href: '/ai-search-visibility', what: 'Multi-location, regional or high-ticket; 16 pages a month; 6-month first term', price: 'From $6,997/mo + $2,500 setup', billing: 'Monthly after setup' },
    { product: 'YardMailer setup', href: '/postcards', what: 'Charged once per customer', price: POSTCARD_SETUP_LABEL, billing: 'One time' },
    { product: 'YardMailer 4×6 card', href: '/postcards', what: 'Printing, postage and mailing included', price: POSTCARD_SIZES['4x6'].unitLabel, billing: 'Per card, from 100 cards' },
    { product: 'YardMailer 6×9 card', href: '/postcards', what: 'Printing, postage and mailing included', price: POSTCARD_SIZES['6x9'].unitLabel, billing: 'Per card, from 100 cards' },
    ...postcardPackageRows().map((row) => ({
      product: `YardMailer ${row.quantity} cards`,
      href: '/postcards#packages',
      what: 'Package total, including the one-time setup',
      price: `4×6 ${row.fourBySixLabel} · 6×9 ${row.sixByNineLabel}`,
      billing: 'One time',
    })),
    { product: 'Google Business Profile setup', href: '/google-profile', what: 'Categories, services, description, photos, hours, review QR', price: '$99', billing: 'One time' },
    { product: 'Google profile care', href: '/google-profile/management', what: '4 posts a month, details kept current, drafted review replies, monthly report', price: '$99/mo', billing: 'Monthly, cancel anytime' },
    { product: 'Google profile care plus', href: '/google-profile/management', what: '8 posts a month, every review answered, photo uploads, Q&A', price: '$179/mo', billing: 'Monthly, cancel anytime' },
    { product: 'AI receptionist + Google profile bundles', href: 'https://executivereceptionist.com/receptionist/packages', what: 'Ava answers missed calls plus profile care; setup included', price: '$159 to $499/mo', billing: 'Monthly, on executivereceptionist.com' },
    { product: 'Review requests (ReputationFlow)', href: '/reputation', what: 'Free starter link, or email requests and reply drafts', price: '$0 or $20/mo', billing: 'On tryreputationflow.com' },
    { product: 'Business lead lists', href: '/leads', what: 'Spreadsheet of businesses with their published emails', price: 'From $20', billing: 'One time' },
    { product: 'Free tools', href: '/free-tools', what: 'Grader, postcard calculators, Lead Scout, writing agents', price: 'Free', billing: 'No card' },
  ];
}

