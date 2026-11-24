/**
 * Front Porch Growth "vs" pages. Every competitor fact was read from that company's own
 * public page on FPG_COMPARE_CHECKED (America/Chicago). Re-check before changing a number.
 * No ratings, reviews, or customer counts for either side.
 */
export const FPG_COMPARE_CHECKED = '2026-11-22';
export const FPG_COMPARE_CHECKED_LABEL = 'November 22, 2026';

export type VsRow = { label: string; us: string; them: string };
export type VsFaq = { q: string; a: string };

export type FpgCompetitor = {
  slug: string;
  name: string;
  ourProduct: string;
  ourHref: string;
  group: 'Google profile & local SEO' | 'Postcards' | 'AI search' | 'Reviews';
  title: string;
  description: string;
  h1: string;
  fit: string;
  rows: VsRow[];
  costHeading: string;
  costMath: string[];
  theyAreBetter: string[];
  weAreBetter: string[];
  sources: Array<{ label: string; url: string }>;
  faqs: VsFaq[];
};

export const FPG_COMPETITORS: FpgCompetitor[] = [
  {
    slug: 'front-porch-growth-vs-local-seo-bot',
    name: 'Local SEO Bot',
    ourProduct: 'Google Business Profile setup',
    ourHref: '/google-profile',
    group: 'Google profile & local SEO',
    title: 'Front Porch Growth vs Local SEO Bot (Google Profile)',
    description:
      'A $99 one-time Google Business Profile setup next to Local SEO Bot’s $99/mo plan. Prices checked Nov 22, 2026 from each company’s own page.',
    h1: 'Front Porch Growth vs Local SEO Bot',
    fit: 'Local SEO Bot is a monthly subscription that keeps posting and tracking. Front Porch Growth sets the Google profile up right once, for a flat $99, and you keep it from there.',
    rows: [
      { label: 'Starting price', us: '$99 one time', them: '$99/mo per location (Foundation); $199/mo (Growth)' },
      { label: 'Cost over 12 months, one location', us: '$99', them: '$1,188 on Foundation paid monthly' },
      { label: 'Contract', us: 'None. It is a one-time job.', them: 'No contracts; 3-day free trial' },
      { label: 'Profile categories, services, photos, hours', us: 'Done for you, once', them: 'Automated audit and fixes monthly' },
      { label: 'Google posts', us: 'Not included', them: '3 posts a week' },
      { label: 'Map rank tracking', us: 'Not included', them: 'Included (weekly heat maps)' },
      { label: 'Review link and QR code', us: 'Included', them: 'Included' },
      { label: 'Ranking promise', us: 'None. Nobody can honestly promise a map ranking.', them: '“Rank higher in 30 days, or get your money back”' },
    ],
    costHeading: 'What one location costs in a year',
    costMath: [
      'Local SEO Bot Foundation: $99 × 12 months = $1,188 if paid monthly. Its pricing page says paying yearly saves 50%.',
      'Front Porch Growth profile setup: $99 once. If you later want help keeping it current, ask first; there is no automatic renewal.',
    ],
    theyAreBetter: [
      'Ongoing automation: weekly posts, review replies, rank tracking and citations every month.',
      'Multi-location pricing that drops at 5 and 15 locations on their Growth plan.',
    ],
    weAreBetter: [
      'One flat payment instead of a subscription that runs every month.',
      'A person sets up categories, services, description and photos for your trade and town.',
      'No ranking promise, so nothing in the pitch depends on a number nobody controls.',
    ],
    sources: [{ label: 'localseobot.com/pricing', url: 'https://www.localseobot.com/pricing/' }],
    faqs: [
      {
        q: 'Can I use both?',
        a: 'Yes. A clean profile setup is a good starting point for any posting or tracking tool, including Local SEO Bot.',
      },
      {
        q: 'What do you need from me for the $99 setup?',
        a: 'Manager access to your Google Business Profile (or help claiming it), 5 to 15 job photos, your service area, and the services you want to be found for.',
      },
    ],
  },
  {
    slug: 'front-porch-growth-vs-brightlocal',
    name: 'BrightLocal',
    ourProduct: 'Google Business Profile setup',
    ourHref: '/google-profile',
    group: 'Google profile & local SEO',
    title: 'Front Porch Growth vs BrightLocal for Local Shops',
    description:
      'Done-for-you $99 Google profile setup next to BrightLocal’s self-serve plans from $41/mo monthly. Prices checked Nov 22, 2026.',
    h1: 'Front Porch Growth vs BrightLocal',
    fit: 'BrightLocal is local SEO software you run yourself (or pay their team to run). Front Porch Growth does one job for you: a complete Google Business Profile, for $99 once.',
    rows: [
      { label: 'Starting price, one location', us: '$99 one time', them: 'Track $41/mo billed monthly ($31/mo billed annually)' },
      { label: 'Other plans', us: 'None for this service', them: 'Manage $54/mo, Grow $65/mo billed monthly; managed SEO $499/mo' },
      { label: 'Who does the work', us: 'Done for you', them: 'You, in their software (managed service costs extra)' },
      { label: 'Rank tracking and audits', us: 'Not included', them: 'Included from Track' },
      { label: 'Google post scheduler', us: 'Not included', them: 'Listed as a feature' },
      { label: 'Review link and QR code', us: 'Included', them: 'Reputation tools on Grow' },
      { label: 'Free trial', us: 'The SEO & AI visibility grader is free', them: 'Free trial; no card up front, per their FAQ' },
    ],
    costHeading: 'What one location costs in a year',
    costMath: [
      'BrightLocal Track, billed monthly: $41 × 12 = $492. Billed annually: $369.',
      'Front Porch Growth profile setup: $99 once.',
    ],
    theyAreBetter: [
      'Deep reporting: rank tracking, geo-grid maps, citation audits and AI visibility tracking.',
      'Built for agencies and multi-location brands, with pricing tiers up to 100 locations.',
    ],
    weAreBetter: [
      'Nothing to learn or log into. You send access and photos; the profile gets fixed.',
      'One price, published, with no monthly renewal.',
    ],
    sources: [{ label: 'brightlocal.com/pricing', url: 'https://www.brightlocal.com/pricing/' }],
    faqs: [
      {
        q: 'Should a one-truck shop buy local SEO software?',
        a: 'Only if someone will log in and use it every week. If not, a correct profile and steady honest reviews do more than a dashboard nobody opens.',
      },
      {
        q: 'Does Front Porch Growth track my rankings?',
        a: 'Not for this $99 service. The free grader shows what search engines and AI assistants can read on your site; it does not track map positions.',
      },
    ],
  },
  {
    slug: 'yardmailer-vs-postcardmania',
    name: 'PostcardMania',
    ourProduct: 'YardMailer postcards',
    ourHref: '/postcards',
    group: 'Postcards',
    title: 'YardMailer vs PostcardMania: Postcard Prices',
    description:
      'YardMailer’s all-in per-card price next to PostcardMania’s published print-only price guide. Prices checked Nov 22, 2026 from each company’s page.',
    h1: 'YardMailer vs PostcardMania',
    fit: 'PostcardMania is a large full-service direct-mail company that quotes each campaign. YardMailer is one product: a card that shows the homeowner a concept for their own property, priced per card with postage included.',
    rows: [
      { label: 'Published price', us: '$3.54 per 4×6 or $4.95 per 6×9, plus $127 setup once', them: 'Print-only guide: $0.12 (low volume) to $0.06 (high volume) per 4.25×6 postcard' },
      { label: 'Postage included?', us: 'Yes: printing, postage and mailing', them: 'No. Their page says postage, list and design are added in a custom quote' },
      { label: 'Minimum order', us: '100 cards', them: 'Not published; quote-based' },
      { label: 'Design', us: 'AI concept of a project for that home, approved by you', them: 'Design team; priced in the quote' },
      { label: 'Response path', us: 'QR code to an estimate-request page', them: 'Campaign options in the quote' },
      { label: 'Approval before mailing', us: 'You approve design, audience and cost first', them: 'Quote and proof process' },
    ],
    costHeading: 'What 250 cards cost',
    costMath: [
      'YardMailer 4×6: $127 setup + 250 × $3.54 = $1,012 total, postage included. Later orders skip the setup fee.',
      'PostcardMania 4.25×6: 250 × $0.12 = $30 for printing at the low-volume guide price, before postage, mailing list and design, which their page says come in a custom quote.',
    ],
    theyAreBetter: [
      'Far lower per-piece printing cost at volume, and many formats (jumbo cards, brochures, door hangers).',
      'A full marketing team for bigger, recurring campaigns.',
    ],
    weAreBetter: [
      'One all-in price per card you can see before you order, with postage included.',
      'Each card shows a concept for that property, not a generic flyer.',
      'Small first runs: 100 cards to a few streets.',
    ],
    sources: [{ label: 'postcardmania.com/pricing', url: 'https://www.postcardmania.com/pricing/' }],
    faqs: [
      {
        q: 'Why is YardMailer’s per-card price higher than a print price?',
        a: 'Because it is not a print price. It includes printing, postage and mailing, plus a property-specific concept and the QR estimate page.',
      },
      {
        q: 'Is there a monthly plan?',
        a: 'No. There is no monthly postcard plan. You pay for the cards you order.',
      },
    ],
  },
  {
    slug: 'yardmailer-vs-eddm',
    name: 'USPS EDDM',
    ourProduct: 'YardMailer postcards',
    ourHref: '/postcards',
    group: 'Postcards',
    title: 'YardMailer vs USPS EDDM: Cost and Effort',
    description:
      'USPS Every Door Direct Mail retail postage is $0.260 a piece. See what YardMailer adds for $3.54–$4.95 a card. Checked Nov 22, 2026 on usps.com.',
    h1: 'YardMailer vs USPS Every Door Direct Mail',
    fit: 'EDDM is the cheapest way to put a flat in every mailbox on a route, if you design, print, bundle and drop it off yourself. YardMailer does the design, printing and mailing and makes each card about the house it goes to.',
    rows: [
      { label: 'Postage', us: 'Included in $3.54 (4×6) or $4.95 (6×9) per card', them: '$0.260 per piece, EDDM Retail (flats up to 3.3 oz)' },
      { label: 'Printing and design', us: 'Included', them: 'Yours to arrange and pay for' },
      { label: 'Who it reaches', us: 'The homeowners on the streets you pick', them: 'Every address on the routes you pick, addressed to “Postal Customer”' },
      { label: 'Quantity', us: 'From 100 cards', them: '200 to 5,000 pieces per ZIP Code per day at retail' },
      { label: 'Drop-off', us: 'We mail it', them: 'You bring bundles to the Post Office' },
      { label: 'Card format', us: '4×6 or 6×9 postcard', them: 'Must meet USPS flat-size rules' },
    ],
    costHeading: 'What 500 pieces cost',
    costMath: [
      'EDDM Retail postage: 500 × $0.260 = $130, plus printing, design and your time to bundle and drop off.',
      'YardMailer 4×6: $127 setup + 500 × $3.54 = $1,897 total with printing, postage and mailing. Later orders skip the setup fee.',
    ],
    theyAreBetter: [
      'The lowest postage for saturating whole carrier routes.',
      'No middleman if you already have a designer and a printer.',
    ],
    weAreBetter: [
      'Nothing to design, print, bundle or drive to the Post Office.',
      'A concept for each property and a QR estimate page, instead of one flyer for every door.',
    ],
    sources: [
      { label: 'USPS EDDM prices', url: 'https://www.usps.com/business/every-door-direct-mail.htm' },
      { label: 'USPS Notice 123 price list (effective Oct 4, 2026)', url: 'https://pe.usps.com/Text/DMM300/Notice123.htm' },
    ],
    faqs: [
      {
        q: 'Can I mail YardMailer cards with EDDM?',
        a: 'No. YardMailer cards are mailed for you, with postage included in the per-card price.',
      },
      {
        q: 'Which is cheaper?',
        a: 'Per piece, EDDM postage is far cheaper. The difference is the design, printing, mailing and property-specific concept YardMailer includes. Use the calculator to see your own numbers.',
      },
    ],
  },
  {
    slug: 'front-porch-growth-vs-aeo-engine',
    name: 'AEO Engine',
    ourProduct: 'AI Search Visibility',
    ourHref: '/ai-search-visibility',
    group: 'AI search',
    title: 'Front Porch Growth vs AEO Engine for AI Search',
    description:
      'Local AI search plans from $1,497/mo with a +30% guarantee, next to AEO Engine’s $1,597–$2,997/mo programs. Prices from each company’s page, Nov 2026.',
    h1: 'Front Porch Growth vs AEO Engine',
    fit: 'AEO Engine runs high-volume content, PR and backlink programs for brands. Front Porch Growth’s AI Search Visibility is built for local and B2B service businesses (trades, dentists, med spas, law firms) town by town, and starts with a free Competitor Gap Report.',
    rows: [
      { label: 'First step', us: 'Free Competitor Gap Report; optional $497 Citation Sprint', them: '30-minute strategy call' },
      { label: 'Monthly plans', us: '$1,497 · $2,997 · $4,997 a month', them: 'Growth $1,597 · Scale $2,997 · Enterprise from $10,000 a month' },
      { label: 'Term', us: '90-day first term, then month to month with 30 days’ notice', them: '90-day initial term, billed monthly' },
      { label: 'Focus', us: 'Local and B2B service businesses by field and town; answer pages multiplied into Google posts, video scripts and LinkedIn posts', them: 'Brands; 30–60 articles a month, backlinks, PR campaigns' },
      { label: 'What is measured', us: 'Citation share on 60–200 questions run every week, with a Friday report showing every answer', them: 'Organic + AI traffic; AI visibility tracking for 150–300 prompts' },
      { label: 'Promise', us: '+30% AI citation share or +30% AI and organic traffic by day 90 (you pick), or we work free up to 90 days, then refund your last month', them: '30% organic + AI traffic growth in 90 days for qualified clients, or they work free' },
    ],
    costHeading: 'First 90 days, entry plan',
    costMath: [
      'AEO Engine Growth: $1,597 × 3 = $4,791 for the 90-day initial term.',
      'Front Porch Growth Found: $1,497 × 3 = $4,491, after a free Gap Report. The $497 Sprint is credited to your first month if you start a plan within 30 days.',
    ],
    theyAreBetter: [
      'Much larger content and PR volume, and a white-label program for agencies.',
      'Built for brands competing nationally for a whole category.',
    ],
    weAreBetter: [
      'Made for local fields town by town: real town pages, cost pages, and compliance-aware pages for dentists, med spas and law firms.',
      'A transparent report every Friday with every question and every answer, not a monthly summary.',
      'A free report first, so you see the gaps before paying anything.',
      'One business per field per town on the Recommended plan.',
    ],
    sources: [{ label: 'aeoengine.ai/pricing', url: 'https://aeoengine.ai/pricing' }],
    faqs: [
      {
        q: 'Is AI search visibility the same as AEO or GEO?',
        a: 'Yes, people use all three names for the work of getting a business named and cited in AI answers.',
      },
      {
        q: 'Do you guarantee a spot in ChatGPT?',
        a: 'No. AI answers change from run to run. Front Porch Growth sets a measured citation-share target and shares every logged answer.',
      },
    ],
  },
  {
    slug: 'front-porch-growth-vs-otterly',
    name: 'Otterly.ai',
    ourProduct: 'AI Search Visibility',
    ourHref: '/ai-search-visibility',
    group: 'AI search',
    title: 'Front Porch Growth vs Otterly.ai: Track or Fix?',
    description:
      'Otterly.ai tracks AI search mentions from €29/mo. Front Porch Growth does the fixes for local shops. Prices checked Nov 22, 2026 from each company’s page.',
    h1: 'Front Porch Growth vs Otterly.ai',
    fit: 'Otterly.ai is monitoring software: it checks prompts across AI engines and reports where you appear. Front Porch Growth does the work that changes what those answers say, for local service businesses.',
    rows: [
      { label: 'What you buy', us: 'Done-for-you pages, schema, listings and reviews flow', them: 'AI search tracking software' },
      { label: 'Starting price', us: 'Free Gap Report; $497 Sprint; plans from $1,497/mo', them: 'Lite €29/mo (16 prompts); higher plans €189 and €489/mo; excluding tax' },
      { label: 'Who does the fixes', us: 'Front Porch Growth, with your approval', them: 'You or your agency' },
      { label: 'Tracking', us: 'Agreed questions checked monthly to weekly, depending on plan', them: 'Daily tracking; weekly on Premium' },
      { label: 'Free option', us: 'Free SEO & AI visibility grader', them: 'Free trial' },
    ],
    costHeading: 'Who each one fits',
    costMath: [
      'If you or a marketer will act on the data every week, Otterly.ai Lite at €29 a month is the cheaper place to start.',
      'If nobody has time to write pages and fix listings, the tracking alone will not change the answers; that is the work the Front Porch Growth plans include.',
    ],
    theyAreBetter: [
      'Inexpensive tracking with unlimited brands and competitors on every plan.',
      'Good fit for agencies reporting on many clients.',
    ],
    weAreBetter: [
      'The pages, schema, listings and review flow are written and shipped for you.',
      'Local trade focus, starting with roofers.',
    ],
    sources: [{ label: 'otterly.ai/pricing', url: 'https://otterly.ai/pricing' }],
    faqs: [
      {
        q: 'Can I start with the free grader instead?',
        a: 'Yes. The grader at /ai-visibility checks what search engines and AI assistants can read on your site, without an account.',
      },
      {
        q: 'Do you use Otterly.ai?',
        a: 'This page does not claim any partnership. It compares published prices and what each product is.',
      },
    ],
  },
  {
    slug: 'front-porch-growth-vs-nicejob',
    name: 'NiceJob',
    ourProduct: 'Review requests (ReputationFlow)',
    ourHref: '/reputation',
    group: 'Reviews',
    title: 'Front Porch Growth vs NiceJob: Review Requests',
    description:
      'ReputationFlow review requests (free or $20/mo) next to NiceJob’s $95 and $135/mo plans. Prices checked Nov 22, 2026 from each company’s page.',
    h1: 'Front Porch Growth (ReputationFlow) vs NiceJob',
    fit: 'NiceJob is a full reputation-marketing suite with texting, widgets and referral campaigns. ReputationFlow, the review tool Front Porch Growth points you to, is a simple review link, QR code and email requests.',
    rows: [
      { label: 'Starting price', us: 'Free starter (one review link); Professional $20/mo', them: 'Starter $95/mo; Pro $135/mo' },
      { label: 'Review requests', us: 'Email requests on Professional', them: 'SMS and email requests' },
      { label: 'Review reply drafts', us: 'Included on Professional', them: 'AI replies on Pro' },
      { label: 'Website review widget', us: 'Not included', them: 'Included' },
      { label: 'Setup fee', us: 'None', them: 'Not listed; 14-day trial' },
      { label: 'Review gating', us: 'Never. Every customer sees the same public links.', them: 'Not stated on the pricing page' },
    ],
    costHeading: 'What a year costs',
    costMath: [
      'NiceJob Starter: $95 × 12 = $1,140.',
      'ReputationFlow Professional: $20 × 12 = $240, or $0 on the free starter.',
    ],
    theyAreBetter: [
      'Text-message requests, review widgets, referrals, email broadcasts and integrations with field-service software.',
    ],
    weAreBetter: [
      'A free option and a $20 plan for shops that only need the ask and the reply.',
      'The same public review links for every customer, with no filtering.',
    ],
    sources: [
      { label: 'get.nicejob.com/pricing', url: 'https://get.nicejob.com/pricing' },
      { label: 'tryreputationflow.com/pricing', url: 'https://tryreputationflow.com/pricing' },
    ],
    faqs: [
      {
        q: 'Is ReputationFlow part of Front Porch Growth?',
        a: 'ReputationFlow is a separate site Cole Collins also runs. Its price is on tryreputationflow.com, not a new charge here.',
      },
      {
        q: 'Does ReputationFlow send texts?',
        a: 'No. Professional sends email requests. This page does not claim text-message requests.',
      },
    ],
  },
];

export function fpgCompetitor(slug: string) {
  return FPG_COMPETITORS.find((c) => c.slug === slug);
}
