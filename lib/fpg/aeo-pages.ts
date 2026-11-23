/**
 * Answer-first AI search visibility pages under /ai-search-visibility/[slug] on frontporchgrowth.com.
 * Rules (TRUST): every fact is ours, published, or sourced; observations are dated and anonymous;
 * no client results are claimed. Titles <= 60 chars, descriptions <= 155 (checked by npm test).
 */
export type FpgAeoSource = { label: string; url: string };
export type FpgAeoPage = {
  slug: string;
  navLabel: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  directAnswer: string;
  serviceName: string;
  areaServed: string[];
  checksTitle: string;
  checks: string[];
  questionsTitle: string;
  questions: string[];
  sections: Array<{ title: string; body: string }>;
  faqs: Array<{ q: string; a: string }>;
  sources: FpgAeoSource[];
  related: string[];
};

export const AEO_CHECKED_LABEL = 'November 2026';

const SOURCES = {
  brightlocal: {
    label: 'BrightLocal, Local Consumer Review Survey 2026 (1,002 US adults, published Mar 10, 2026)',
    url: 'https://www.brightlocal.com/research/lcrs-ai-trust/',
  },
  pew: {
    label: 'Pew Research Center, “Google users are less likely to click on links when an AI summary appears” (Jul 22, 2025)',
    url: 'https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/',
  },
  ftc: {
    label: 'FTC rule on consumer reviews and testimonials (Federal Register, Aug 22, 2024)',
    url: 'https://www.federalregister.gov/documents/2024/08/22/2024-18519/trade-regulation-rule-on-the-use-of-consumer-reviews-and-testimonials',
  },
} satisfies Record<string, FpgAeoSource>;

const PRICES =
  'Front Porch Growth’s published prices: a free Competitor Gap Report, a $497 Citation Sprint (one time, credited to month one if you start a plan within 30 days), Found at $1,500 a month, Recommended at $2,750, and Market Leader at $4,500, or Pay When Named on Found and Recommended.';

const NOT_AFFILIATED = {
  q: 'Are you affiliated with OpenAI, Google or Perplexity?',
  a: 'No. ChatGPT, Google AI Overviews and Perplexity are trademarks of their owners. We test how their public answers describe local businesses; we do not have special access.',
};

const NO_PROMISE = {
  q: 'Can you guarantee AI will name my shop?',
  a: 'No one can. AI answers change from one run to the next. Monthly plans come with a written day-90 target measured on your own money questions, with the full log shared, and Pay When Named lets you skip the monthly bill until you are named.',
};

export const FPG_AEO_PAGES: FpgAeoPage[] = [
  {
    slug: 'hvac',
    navLabel: 'HVAC companies',
    title: 'AI Search Visibility for Alabama HVAC Companies',
    description:
      'When Alabama homeowners ask AI who to call for AC or heat, it names 2–3 shops. How AI picks them, what we fix, and the published prices.',
    eyebrow: 'AI SEARCH VISIBILITY · HVAC · ALABAMA',
    h1: 'AI search visibility for Alabama HVAC companies',
    directAnswer:
      'When someone asks ChatGPT, Google’s AI Overviews or Perplexity for the best HVAC company in Cullman, Gadsden or Huntsville, the answer usually names two or three shops. Those names come from what the tools can read: Google Business Profiles, review counts across sites, BBB and directory listings, manufacturer dealer locators, and websites with clear service and town pages. Front Porch Growth, in Hanceville, Alabama, fixes those inputs for HVAC shops and logs every check so you can see whether you are named.',
    serviceName: 'AI search visibility for HVAC companies',
    areaServed: ['Cullman', 'Gadsden', 'Huntsville', 'Birmingham', 'Alabama'],
    checksTitle: 'What our own checks showed (November 2026)',
    checks: [
      '“Best HVAC company Cullman AL”: the answer named three shops. Several well-reviewed Cullman HVAC companies in the listings behind it, including some running ads, were not named.',
      '“Best HVAC company Huntsville AL locally owned”: the answer named three shops. Companies with 160 or more Google reviews were in the data but not in the answer.',
      'The pattern: named shops tended to have consistent listings across many sites and clear service and town information. Review count alone did not guarantee a mention.',
      'These are single dated runs with an AI search tool. Answers change from run to run, which is why we log every check.',
    ],
    questionsTitle: 'Money questions we track for HVAC shops',
    questions: [
      'best HVAC company {town}',
      'emergency AC repair {town}',
      'AC repair open on the weekend {town}',
      'heat pump replacement cost {town}',
      'furnace not working, who do I call {town}',
      'HVAC maintenance plan {town}',
      'mini split installer {town}',
      'Trane, Carrier or Lennox dealer near {town}',
    ],
    sections: [
      { title: 'Google Business Profile', body: 'HVAC categories, services with price ranges, service area, after-hours information, and seasonal posts: tune-ups in spring, heat checks in fall.' },
      { title: 'Dealer locators and listings', body: 'Manufacturer dealer locators, BBB, Angi, Nextdoor, your chamber and home builders association, with the same name, address and phone everywhere.' },
      { title: 'Answer-first HVAC pages', body: '“How much does a new AC cost in your town?”, “AC not cooling: what to check before you call”, and “heat pump vs. gas furnace in North Alabama”, each opening with a short answer and marked up with HVACBusiness and FAQ schema.' },
      { title: 'Honest review flow', body: 'A text-after-every-job kit and replies to every review. We never write, buy or filter reviews; the FTC banned fake reviews in 2024.' },
    ],
    faqs: [
      {
        q: 'I already run Google Ads and Local Services Ads. Why do this too?',
        a: 'Ads buy the click on a results page. The AI answer is a separate, unpaid spot, and in our checks it often went to a shop that was not running ads. Pew Research found people clicked a regular result on 8% of Google visits with an AI summary versus 15% without one.',
      },
      {
        q: 'Do you work with my competitor?',
        a: 'On Recommended and Market Leader we take one HVAC shop per town, so we never work for your direct competitor there.',
      },
      NO_PROMISE,
      NOT_AFFILIATED,
    ],
    sources: [SOURCES.pew, SOURCES.brightlocal, SOURCES.ftc],
    related: ['plumbing', 'gadsden-al', 'cost'],
  },
  {
    slug: 'plumbing',
    navLabel: 'Plumbers & septic',
    title: 'AI Search Visibility for Alabama Plumbers & Septic',
    description:
      'Get your plumbing or septic shop named when Alabama homeowners ask AI for a plumber. What our checks showed, what we fix, and published prices.',
    eyebrow: 'AI SEARCH VISIBILITY · PLUMBING & SEPTIC · ALABAMA',
    h1: 'AI search visibility for Alabama plumbers and septic companies',
    directAnswer:
      'Plumbing questions in AI tools are often emergencies, such as “emergency plumber near me” or “water heater burst, who do I call”, and the answer names two or three companies. In our checks, local plumbers with hundreds of Google reviews were sometimes left out while national franchises were named. Front Porch Growth helps Alabama plumbing and septic shops fix the profile, listings, reviews and town pages that AI reads, and shows every check in a dated log.',
    serviceName: 'AI search visibility for plumbing and septic companies',
    areaServed: ['Gadsden', 'Rainbow City', 'Huntsville', 'Albertville', 'Boaz', 'Alabama'],
    checksTitle: 'What our own checks showed (November 2026)',
    checks: [
      '“Best plumber in Gadsden AL”: the answer named two shops. Plumbers named for the narrower “emergency plumber Rainbow City” question were not named for the bigger Gadsden one.',
      '“Best plumber Huntsville AL”: the answer named three, two of them national franchises. Local shops with 300 to 1,400+ Google reviews were in the data but not named.',
      '“Septic tank service Albertville Boaz AL”: the answer named three local septic companies. Septic is a less crowded question, so it can be an easier win for plumbing-and-septic shops.',
      'These are single dated runs. Answers change, which is why we log every check.',
    ],
    questionsTitle: 'Money questions we track for plumbers',
    questions: [
      'best plumber {town}',
      'emergency plumber {town}',
      '24 hour plumber near {town}',
      'water heater replacement cost {town}',
      'sewer line repair {town}',
      'septic tank pumping {town}',
      'slab leak repair {town}',
      'drain cleaning near {town}',
    ],
    sections: [
      { title: 'Emergency-ready profile', body: 'Hours that match how you really answer, an emergency service listed with a price range, and every town you cover in the service area.' },
      { title: 'Town and cost pages', body: 'Answer-first pages like “water heater replacement cost in Gadsden” and “emergency plumber Rainbow City”, with Plumber and FAQ schema.' },
      { title: 'Listings that agree', body: 'BBB, Angi, Yelp, Nextdoor, Apple Maps and Bing Places with the same name, address and phone, so AI does not see two different businesses.' },
      { title: 'Reviews beyond Google', body: 'BrightLocal’s 2026 survey found 45% of US consumers used AI tools for local recommendations, and AI tools read reviews on many sites. We help you ask every customer, honestly.' },
    ],
    faqs: [
      {
        q: 'Why would AI name a national franchise over my local shop?',
        a: 'In our checks, the named shops had more consistent listings and clearer pages about the service and town. Franchises usually have both. A local shop can match that with a complete profile, matching listings and real town pages.',
      },
      {
        q: 'Do you do septic too?',
        a: 'Yes. Septic questions were less crowded in our checks, so they are often a good first target for plumbing-and-septic shops.',
      },
      NO_PROMISE,
      NOT_AFFILIATED,
    ],
    sources: [SOURCES.brightlocal, SOURCES.pew, SOURCES.ftc],
    related: ['hvac', 'gadsden-al', 'cost'],
  },
  {
    slug: 'roofing',
    navLabel: 'Roofing companies',
    title: 'AI Search Visibility for Alabama Roofing Companies',
    description:
      'How AI picks a roofer when Alabama homeowners ask after a storm, what it read in our Cullman check, and how we help roofers get named.',
    eyebrow: 'AI SEARCH VISIBILITY · ROOFING · ALABAMA',
    h1: 'AI search visibility for Alabama roofing companies',
    directAnswer:
      'When a homeowner asks AI for the best roofing company in their town, the answer names a few roofers and leans on sources it trusts: local “best of” awards, BBB profiles, state license records, review counts and the roofer’s own pages. Front Porch Growth helps Alabama roofers make sure those sources describe them accurately and completely, adds answer-first storm and cost pages, and logs whether AI names them, month by month.',
    serviceName: 'AI search visibility for roofing companies',
    areaServed: ['Cullman', 'Huntsville', 'Gadsden', 'Birmingham', 'Alabama'],
    checksTitle: 'What our own check showed (November 23, 2026)',
    checks: [
      '“Best roofing company Cullman AL”: the answer named three roofers.',
      'It cited a local newspaper’s “Best of” awards, a BBB profile, a state license-records site, and Google rating counts, not just company websites.',
      'A roofer cited for its 5.0 rating and active license was named alongside one with 430 ratings, so a big review count was not the only way in.',
      'This is one dated run. Answers change, which is why we log every check.',
    ],
    questionsTitle: 'Money questions we track for roofers',
    questions: [
      'best roofing company {town}',
      'roof repair after storm {town}',
      'hail damage roof inspection {town}',
      'roof replacement cost {town}',
      'metal roof installer {town}',
      'emergency roof tarp {town}',
      'roofer that works with insurance {town}',
      'licensed roofer near {town}',
    ],
    sections: [
      { title: 'The sources AI quoted', body: 'BBB profile, license details, local awards and chamber listings, kept accurate and consistent with your Google profile.' },
      { title: 'Storm pages within 48 hours', body: 'On Market Leader, after a hail or wind event we publish a short, factual page for the affected towns: what to check, what to photograph, and how to reach you.' },
      { title: 'Cost and material pages', body: 'Answer-first pages like “roof replacement cost in Cullman” and “metal vs. shingle in North Alabama”, with RoofingContractor and FAQ schema.' },
      { title: 'Calls you can answer', body: 'Being named only helps if someone picks up. Our sister brand, Executive Receptionist, has an AI receptionist for storm-day overflow.' },
    ],
    faqs: [
      {
        q: 'Do “best of” awards really matter to AI?',
        a: 'In our Cullman check, the answer cited a local newspaper’s awards list. We can’t promise any award, but we make sure the places that list you have your correct name, phone and services.',
      },
      {
        q: 'Do you write storm-chaser style pages?',
        a: 'No. Storm pages are factual and limited to towns you actually serve. No scare tactics and no fake urgency.',
      },
      NO_PROMISE,
      NOT_AFFILIATED,
    ],
    sources: [SOURCES.brightlocal, SOURCES.ftc],
    related: ['hvac', 'cost', 'aeo-vs-seo'],
  },
  {
    slug: 'gadsden-al',
    navLabel: 'Gadsden, AL',
    title: 'AI Search Visibility in Gadsden, AL for Local Trades',
    description:
      'Who AI names when Gadsden and Etowah County homeowners ask for HVAC, plumbing or electrical help, and how local shops can get named.',
    eyebrow: 'AI SEARCH VISIBILITY · GADSDEN & ETOWAH COUNTY',
    h1: 'AI search visibility for Gadsden trades',
    directAnswer:
      'In our November 2026 checks of Gadsden-area HVAC, plumbing, electrical, pest control and garage door questions, AI answers named two or three shops each time and leaned on map listings and directory lists. Several well-reviewed local shops with thin websites or mismatched addresses were left out. Front Porch Growth, based in Hanceville, helps Gadsden, Rainbow City, Attalla, Southside and Glencoe shops fix what AI reads, starting with a free Gap Report.',
    serviceName: 'AI search visibility for Gadsden-area trades',
    areaServed: ['Gadsden', 'Rainbow City', 'Attalla', 'Southside', 'Glencoe', 'Etowah County'],
    checksTitle: 'What our Gadsden checks showed (November 2026)',
    checks: [
      'HVAC, plumbing, electrical, pest control and garage door questions each got two or three names.',
      'Shops named for a narrow question (“emergency plumber Rainbow City”) were not always named for the bigger one (“best plumber in Gadsden AL”).',
      'Several well-reviewed local shops with thin websites or mismatched addresses across listings were left out.',
      'These are dated single runs. We repeat them monthly for clients and log each one.',
    ],
    questionsTitle: 'Gadsden money questions we track',
    questions: [
      'best HVAC company Gadsden AL',
      'emergency plumber Rainbow City',
      'electrician near Attalla',
      'garage door repair Gadsden',
      'pest control Southside AL',
      'roof repair Glencoe AL',
      'septic service Etowah County',
      'AC repair open Sunday Gadsden',
    ],
    sections: [
      { title: 'One shop per trade per town', body: 'On Recommended and Market Leader we take one shop per trade in Gadsden, so we never work for your direct competitor here.' },
      { title: 'Town pages with real local facts', body: 'Pages for the towns you actually serve, with your real service area, hours and prices, not copy-paste pages with the town name swapped.' },
      { title: 'Local groups, done honestly', body: 'We find the Gadsden “who do you recommend?” threads and draft helpful answers you post as yourself, following each group’s rules.' },
      { title: 'Close to home', body: 'Front Porch Growth is run by Cole Collins from Hanceville, in Cullman County. Setup is by phone, email and screen share.' },
    ],
    faqs: [
      {
        q: 'Do you have an office in Gadsden?',
        a: 'No. Front Porch Growth is run by Cole Collins from Hanceville, Alabama. We work with Gadsden shops by phone, email and screen share.',
      },
      {
        q: 'What does the free Gap Report cover for a Gadsden shop?',
        a: 'Who AI names for 8 questions your Gadsden customers ask, how your Google profile, reviews and listings compare with the shop it names, and the 5 fixes that matter most. It is free and yours to keep.',
      },
      NO_PROMISE,
      NOT_AFFILIATED,
    ],
    sources: [SOURCES.brightlocal, SOURCES.pew],
    related: ['hvac', 'plumbing', 'cost'],
  },
  {
    slug: 'cost',
    navLabel: 'What it costs',
    title: 'AI Search Optimization Cost for Local Trades (2026)',
    description:
      'What AI search optimization (AEO) costs for a local trade shop in 2026: what you can do free, what a paid plan covers, and our published prices.',
    eyebrow: 'AI SEARCH OPTIMIZATION · COST',
    h1: 'How much does AI search optimization cost for a local shop?',
    directAnswer:
      'The first steps are free if you do them yourself: complete your Google Business Profile, make your name, address and phone match on every listing, ask every customer for a review, and add a page that answers your most common cost question. Paying someone makes sense when you want it done and measured every month. Front Porch Growth’s published prices: a free Gap Report, a $497 one-time Citation Sprint, Found at $1,500 a month, Recommended at $2,750 and Market Leader at $4,500, or Pay When Named on Found and Recommended.',
    serviceName: 'AI search optimization (AEO) for local trades',
    areaServed: ['Alabama'],
    checksTitle: 'What drives the cost',
    checks: [
      'How many questions are tracked, and how often they are re-checked (30 a month on Found, 120 a week on Market Leader).',
      'How many answer-first pages are written each month (4, 8 or 16 on our plans).',
      'How many listings need fixing, and how many towns or service lines you cover.',
      'Whether reviews, local groups and authority placements are included or left to you.',
    ],
    questionsTitle: 'Free steps you can do this week',
    questions: [
      'Fill in every Google Business Profile field: services, prices, service area, hours',
      'Match your name, address and phone on BBB, Yelp, Angi, Apple Maps and Bing Places',
      'Text a review link after every finished job',
      'Publish one page answering “how much does ___ cost in {town}?”',
      'Ask an AI tool your top 5 money questions and write down who it names',
      'Run our free AI visibility grader on your site',
    ],
    sections: [
      { title: 'Citation Sprint, $497 one time', body: '25 customer questions on 4 AI tools, run twice each, a baseline report, 1 answer-first page, schema on 2 pages, and a fix list. Credited to month one if you start a plan within 30 days.' },
      { title: 'Found, $1,500 a month', body: 'One shop, one metro plus nearby towns: 30 questions checked monthly, 4 pages a month, up to 15 listing fixes, Google profile managed, monthly report.' },
      { title: 'Recommended, $2,750 a month', body: '2–4 towns or 2 service lines: 60 questions twice a month, 8 pages, up to 30 listing fixes, reviews and authority placements, one shop per trade per town.' },
      { title: 'Pay When Named', body: '$497 setup, then nothing monthly until you are named on 3 of your 10 money questions in our logged checks. Then Found is $1,750 or Recommended $3,000, 3-month minimum.' },
    ],
    faqs: [
      {
        q: 'Why is AI search work priced like SEO?',
        a: 'Most of the work is the same kind of work: profiles, listings, reviews and pages. What changes is what we measure: whether AI names you for your money questions, not just where you rank.',
      },
      {
        q: 'Is there a monthly contract?',
        a: 'Monthly plans have a 90-day first term because the written target is measured at day 90, then month to month with 30 days’ notice.',
      },
      NO_PROMISE,
      NOT_AFFILIATED,
    ],
    sources: [SOURCES.brightlocal],
    related: ['aeo-vs-seo', 'hvac', 'plumbing'],
  },
  {
    slug: 'aeo-vs-seo',
    navLabel: 'AEO vs SEO',
    title: 'AEO vs SEO for Local Trades: What’s the Difference?',
    description:
      'AEO vs SEO for a local trade shop: what each one aims for, what overlaps, and what to do first. Plain answers from Front Porch Growth.',
    eyebrow: 'AEO VS SEO',
    h1: 'AEO vs SEO for local trades: what is the difference?',
    directAnswer:
      'SEO (search engine optimization) aims to rank your pages in Google’s list of links. AEO (answer engine optimization) aims to get your business named or cited inside the answer that ChatGPT, Google’s AI Overviews or Perplexity writes. For a local trade shop most of the work overlaps: a complete Google Business Profile, matching listings, honest reviews and clear service and town pages. AEO adds pages that open with a short, quotable answer, structured data, and checking the AI answers themselves.',
    serviceName: 'Answer engine optimization (AEO) for local trades',
    areaServed: ['Alabama'],
    checksTitle: 'Why the AI answer matters now',
    checks: [
      'Pew Research Center (July 2025): when a Google AI summary appeared, people clicked a regular search result on 8% of visits, versus 15% when there was no summary.',
      'BrightLocal (March 2026): 45% of US consumers used AI tools for local business recommendations in the past 12 months.',
      'Neither number says AI replaces Google. Both say the answer box is now where a lot of choices start.',
    ],
    questionsTitle: 'What overlaps and what is new',
    questions: [
      'Overlaps: Google Business Profile, listings, reviews, fast and clear website',
      'Overlaps: service pages and town pages',
      'AEO adds: a 2–3 sentence direct answer at the top of each page',
      'AEO adds: FAQ, Service and LocalBusiness structured data',
      'AEO adds: reviews and mentions on more sites than Google',
      'AEO adds: checking who AI names, not just your ranking',
    ],
    sections: [
      { title: 'What to do first', body: 'Fix the overlap first, since it helps both: Google profile, matching listings and reviews. Then add answer-first pages for your money questions.' },
      { title: 'What not to buy', body: 'Anyone promising “#1 in ChatGPT”. AI answers change run to run and no one controls them.' },
      { title: 'How we measure it', body: 'Your money questions, run on 4 AI tools, logged with the date, tool, answer and a screenshot, so you can rerun any of it yourself.' },
      { title: 'We practice on ourselves', body: 'In our November 23, 2026 checks, Front Porch Growth itself was not named for 16 AI-style questions about local marketing in Alabama. These pages are part of fixing that, and we will report the result honestly.' },
    ],
    faqs: [
      {
        q: 'Is GEO the same as AEO?',
        a: 'Mostly. GEO (generative engine optimization) and AEO are two names for the same goal: being named or cited in AI-written answers.',
      },
      {
        q: 'Do I need to stop doing SEO?',
        a: 'No. Most AEO work also helps regular SEO, and Google’s own results still send calls. Think of AEO as SEO plus checking the AI answers.',
      },
      NO_PROMISE,
      NOT_AFFILIATED,
    ],
    sources: [SOURCES.pew, SOURCES.brightlocal],
    related: ['cost', 'hvac', 'gadsden-al'],
  },
];

const bySlug = new Map(FPG_AEO_PAGES.map((page) => [page.slug, page]));
if (bySlug.size !== FPG_AEO_PAGES.length) throw new Error('Duplicate AI search visibility page slug');
for (const page of FPG_AEO_PAGES) {
  for (const slug of page.related) if (!bySlug.has(slug)) throw new Error(`${page.slug} links to missing ${slug}`);
}

export function getFpgAeoPage(slug: string) {
  return bySlug.get(slug);
}

export const FPG_AEO_PRICES_SENTENCE = PRICES;
