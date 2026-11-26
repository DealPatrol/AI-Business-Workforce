/**
 * Answer-first AI search visibility pages under /ai-search-visibility/[slug] on frontporchgrowth.com.
 * Rules (TRUST): every fact is ours, published, or sourced; observations are dated and anonymous;
 * no client results are claimed. Titles <= 60 chars, descriptions <= 155 (checked by npm test).
 */
import {
  AEO_PRICES_SENTENCE,
  GUARANTEE_REGULATED,
  NO_PROMISE_TRADES,
} from '@/lib/fpg/aeo-offer';

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
  /** Eyebrow over the checks list. Defaults to WHAT WE SAW; use another label when the list is advice, not observations. */
  checksEyebrow?: string;
  /** Numbered steps, rendered on the page and published as HowTo JSON-LD. */
  howTo?: { name: string; totalTime: string; steps: Array<{ name: string; text: string }> };
  /** Show the free money-question builder on this page. */
  questionBuilder?: boolean;
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
  openaiSearch: {
    label: 'OpenAI Help Center, “Searching the web with ChatGPT” (read Nov 24, 2026)',
    url: 'https://help.openai.com/en/articles/9237897-chatgpt-search',
  },
  openaiBots: {
    label: 'OpenAI, “Overview of OpenAI crawlers” (OAI-SearchBot and GPTBot; read Nov 24, 2026)',
    url: 'https://platform.openai.com/docs/bots',
  },
  googleAiFeatures: {
    label: 'Google Search Central, “AI features and your website” (read Nov 24, 2026)',
    url: 'https://developers.google.com/search/docs/appearance/ai-features',
  },
  aecb: {
    label: 'Alabama Board of Electrical Contractors (license lookup and rules)',
    url: 'https://aecb.alabama.gov/',
  },
  hhsNewVision: {
    label: 'HHS Office for Civil Rights, settlement with New Vision Dental over patient information in online review replies',
    url: 'https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/agreements/new-vision/index.html',
  },
  alRule72: {
    label: 'Alabama Rules of Professional Conduct, Rule 7.2 (Advertising), as amended effective Jan 1, 2026',
    url: 'https://judicial.alabama.gov/docs/library/rules/cond7_2.pdf',
  },
} satisfies Record<string, FpgAeoSource>;

const PRICES = AEO_PRICES_SENTENCE;

const NOT_AFFILIATED = {
  q: 'Are you affiliated with OpenAI, Google or Perplexity?',
  a: 'No. ChatGPT, Google AI Overviews and Perplexity are trademarks of their owners. We test how their public answers describe local businesses; we do not have special access.',
};

const NO_PROMISE = NO_PROMISE_TRADES;

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
      'The first steps are free if you do them yourself: complete your Google Business Profile, make your name, address and phone match on every listing, ask every customer for a review, and add a page that answers your most common cost question. Paying someone makes sense when you want it done and measured every month. Front Porch Growth’s published prices: a free Gap Report, a $497 one-time Citation Sprint (credited to the setup fee if you start a plan within 30 days), Found at $1,997 a month plus $750 setup (90-day first term), Recommended at $3,497 a month plus $1,250 setup (90-day first term), Market Leader from $6,997 a month plus $2,500 setup (6-month first term), or Pay When Named ($497 setup, then $2,297 or $3,797 a month once named).',
    serviceName: 'AI search optimization (AEO) for local trades',
    areaServed: ['Alabama'],
    checksTitle: 'What drives the cost',
    checks: [
      'How many questions are tracked, and how often they are re-checked (60 a week on Found, 200 a week on Market Leader).',
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
      { title: 'Citation Sprint, $497 one time', body: '25 customer questions on 4 AI tools, run twice each, a baseline report, 1 answer-first page, schema on 2 pages, and a fix list. Credited to the setup fee if you start a plan within 30 days.' },
      { title: 'Found, $1,997 a month plus $750 setup', body: 'One location, one metro plus nearby towns: 60 questions checked weekly, 4 pages a month turned into Google posts, video scripts and LinkedIn posts, up to 15 listing fixes, a report every Friday, a 90-day first term, and a visibility guarantee (named in 3 of 10 money questions by day 90).' },
      { title: 'Recommended, $3,497 a month plus $1,250 setup', body: '2–4 towns or 2 service lines: 120 questions weekly, 8 pages, up to 30 listing fixes, YouTube and LinkedIn publishing, an authority placement a month, one business per field per town, a 90-day first term, and a visibility guarantee (named in 4 of 10 money questions by day 90).' },
      { title: 'Market Leader, from $6,997 a month plus $2,500 setup', body: 'Multi-location, regional or high-ticket: 200 questions weekly plus hand checks on named AI tools, 16 pages a month, 3 authority placements a month, one business per field per region, a 6-month first term, and a visibility guarantee (named in 5 of 10 money questions per market by day 90). Extra locations +$1,500/mo.' },
      { title: 'Pay When Named', body: '$497 setup, then nothing monthly until you are named on 3 of your 10 money questions in our logged checks for two consecutive weekly runs. Then Found is $2,297 or Recommended $3,797, 3-month minimum.' },
    ],
    faqs: [
      {
        q: 'Why is AI search work priced like SEO?',
        a: 'Most of the work is the same kind of work: profiles, listings, reviews and pages. What changes is what we measure: whether AI names you for your money questions, not just where you rank.',
      },
      {
        q: 'Is there a monthly contract?',
        a: 'Found and Recommended have a 90-day first term because the written target is measured at day 90, then month to month with 30 days’ notice. Market Leader has a 6-month first term, then month to month. Setup can be waived with a longer term or if you prepay.',
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
  {
    slug: 'check-if-ai-recommends-you',
    navLabel: 'Check if AI names you',
    title: 'How to Check if ChatGPT Recommends Your Local Shop',
    description:
      'A free 20-minute test: ask ChatGPT, Perplexity and Google the questions your customers ask, log who is named, and read the sources it cites.',
    eyebrow: 'FREE SELF-CHECK · HOW TO',
    h1: 'How to check if ChatGPT recommends your local shop',
    directAnswer:
      'Ask the AI the way a customer would, without your business name: “who is the best plumber in Cullman AL?” Use a fresh chat each time, ask each question at least twice, and run the same questions in ChatGPT, Perplexity and Google. Write down every business named and every site cited. If you are not named, the cited sites show you where to start. It takes about 20 minutes and costs nothing.',
    serviceName: 'AI search visibility self-check for local trades',
    areaServed: ['Alabama'],
    checksEyebrow: 'BEFORE YOU START',
    checksTitle: 'Rules that keep the test honest',
    checks: [
      'Do not type your own business name in the question. That tests whether AI knows you, not whether it would pick you.',
      'Start a new chat for every question, and try once in a private window, so earlier chats do not steer the answer.',
      'Put the town in the question. AI tools may use your location, so run it from your service area if you can.',
      'Save the full answer and the links under it. One run is one sample; answers change from run to run.',
    ],
    questionsTitle: 'Question types to include',
    questions: [
      'The recommendation question: “who is the best {trade} in {town}?”',
      'The emergency question: “who can fix {problem} in {town} today?”',
      'The cost question: “how much does {job} cost in {town}?”',
      'The brand question, asked last: “what do you know about {your business}?”',
    ],
    howTo: {
      name: 'How to check if ChatGPT recommends your local shop',
      totalTime: 'PT20M',
      steps: [
        { name: 'Write 5 customer questions', text: 'Use the builder on this page or write them yourself: the trade, the town, and the problem the way a homeowner says it. Keep the exact wording so you can repeat it next month.' },
        { name: 'Ask each one in a fresh chat', text: 'Open a new chat in ChatGPT for each question. Ask each one twice. If ChatGPT offers web search, use it, and note whether the answer showed sources.' },
        { name: 'Repeat in Perplexity and Google', text: 'Ask the same questions in Perplexity and in Google. Note when Google shows no AI Overview, and keep each tool’s results separate.' },
        { name: 'Log names and sources', text: 'For each run, write the businesses named in order, whether you were named, how you were described, and the sites linked under the answer.' },
        { name: 'Ask the brand question', text: 'Last, ask what the tool knows about your business by name. Check the phone number, the towns and the services. Wrong details here usually come from an old listing.' },
        { name: 'Fix the sources, then re-check monthly', text: 'Claim or correct your listing on the sites that were cited, complete your Google Business Profile, and re-run the same questions on the same day next month.' },
      ],
    },
    questionBuilder: true,
    sections: [
      { title: 'Read the citations first', body: 'The links under an answer show where the tool looked: directories, review sites, local news, license records or a competitor’s pages. If you are missing from those sites, that is the first fix.' },
      { title: 'Let the AI crawlers in', body: 'OpenAI says site owners allow its OAI-SearchBot crawler in robots.txt to appear in ChatGPT search results. If your robots.txt blocks it, ChatGPT search may not read your pages. Check yours, or run our free grader.' },
      { title: 'Google is its own check', body: 'Google says there are no additional requirements or special optimizations to appear in AI Overviews or AI Mode; normal SEO best practices apply. So the same profile, listings and clear pages do double duty.' },
      { title: 'When to get help', body: 'If you want the questions run on 4 tools every month, logged with screenshots, and the fixes done for you, that is what our paid plans are. The free Gap Report shows what we would fix first.' },
    ],
    faqs: [
      {
        q: 'How many times should I ask each question?',
        a: 'At least twice per tool, in fresh chats. AI answers change from run to run, so one answer can be a lucky or unlucky draw. The pattern across runs matters more than any single answer.',
      },
      {
        q: 'Why does ChatGPT name a business that closed or has the wrong number?',
        a: 'The answer is built from what the cited sites say. If a directory or old listing is wrong, the answer can be wrong. Correct the listing at the source and check again later.',
      },
      {
        q: 'Is the question builder an AI tool?',
        a: 'No. It fills your trade and towns into question patterns we use in our own checks. It runs in your browser and sends nothing anywhere. You paste the questions into the AI tools yourself.',
      },
      NO_PROMISE,
      NOT_AFFILIATED,
    ],
    sources: [SOURCES.openaiSearch, SOURCES.openaiBots, SOURCES.googleAiFeatures, SOURCES.brightlocal],
    related: ['cullman-al', 'aeo-vs-seo', 'cost'],
  },
  {
    slug: 'cullman-al',
    navLabel: 'Cullman, AL',
    title: 'AI Search Visibility in Cullman, AL for Local Trades',
    description:
      'Who AI names when Cullman County homeowners ask for HVAC, plumbing, roofing or electrical help, and what local shops can fix. From Hanceville.',
    eyebrow: 'AI SEARCH VISIBILITY · CULLMAN COUNTY',
    h1: 'AI search visibility for Cullman trades',
    directAnswer:
      'When someone in Cullman, Hanceville, Good Hope or Vinemont asks ChatGPT or Google’s AI for a contractor, the answer usually names two or three shops. In our November 2026 Cullman checks, the roofing answer cited a local newspaper’s “Best of” awards, a BBB profile, state license records and Google ratings, and the HVAC answer left out several well-reviewed shops, including some running ads. Front Porch Growth is based in Hanceville and helps Cullman County shops fix what AI reads.',
    serviceName: 'AI search visibility for Cullman County trades',
    areaServed: ['Cullman', 'Hanceville', 'Good Hope', 'Vinemont', 'Holly Pond', 'Cullman County'],
    checksTitle: 'What our Cullman checks showed (November 2026)',
    checks: [
      '“Best HVAC company Cullman AL”: the answer named three shops. Several well-reviewed Cullman HVAC companies in the listings behind it, including some running ads, were not named.',
      '“Best roofing company Cullman AL” (November 23, 2026): the answer named three roofers and cited a local newspaper’s “Best of” awards, a BBB profile, a state license-records site and Google rating counts.',
      'In that roofing answer, a roofer with a 5.0 rating and an active license was named next to one with 430 ratings, so review count alone was not the only way in.',
      'These are dated single runs. Answers change, which is why we log every check.',
    ],
    questionsTitle: 'Cullman County money questions we track',
    questions: [
      'best HVAC company Cullman AL',
      'emergency plumber Hanceville AL',
      'roof repair after storm Cullman',
      'electrician near Good Hope AL',
      'septic tank pumping Cullman County',
      'AC repair open Saturday Cullman',
      'metal roof installer Vinemont',
      'water heater replacement cost Cullman',
    ],
    sections: [
      { title: 'Local sources AI already quotes', body: 'Local “Best of” lists, the Cullman Area Chamber of Commerce directory, BBB, and state license records. We make sure each one has your correct name, phone and services. We cannot promise any award.' },
      { title: 'Town pages that are really local', body: 'Pages for the towns you serve, such as Cullman, Hanceville, Good Hope and Holly Pond, with your real hours, service area and price ranges, not one page copied with the town name swapped.' },
      { title: 'One shop per trade per town', body: 'On Recommended and Market Leader we take one shop per trade in Cullman, so we never work for your direct competitor here.' },
      { title: 'We are down the road', body: 'Front Porch Growth is run by Cole Collins from Hanceville. Setup is by phone, email and screen share, and a Cullman County shop can meet in person if it helps.' },
    ],
    faqs: [
      {
        q: 'Are you actually in Cullman County?',
        a: 'Yes. Front Porch Growth is run by Cole Collins from Hanceville, Alabama, in Cullman County. Most work happens by phone, email and screen share.',
      },
      {
        q: 'What does the free Gap Report cover for a Cullman shop?',
        a: 'Who AI names for 8 questions your Cullman County customers ask, how your Google profile, reviews and listings compare with the shop it names, and the 5 fixes that matter most. It is free and yours to keep.',
      },
      NO_PROMISE,
      NOT_AFFILIATED,
    ],
    sources: [SOURCES.brightlocal, SOURCES.pew],
    related: ['hvac', 'roofing', 'check-if-ai-recommends-you'],
  },
  {
    slug: 'electrical',
    navLabel: 'Electricians',
    title: 'AI Search Visibility for Alabama Electricians',
    description:
      'How Alabama electricians can get named when homeowners ask AI for an electrician: license details, listings, panel and generator pages, and prices.',
    eyebrow: 'AI SEARCH VISIBILITY · ELECTRICAL · ALABAMA',
    h1: 'AI search visibility for Alabama electricians',
    directAnswer:
      'When a homeowner asks AI for an electrician, the answer names a few contractors and leans on what it can verify: Google Business Profiles, review counts across sites, directory listings, license information and pages that say what the shop does in which towns. Alabama electrical contractors are licensed by the Alabama Board of Electrical Contractors, so a consistent license number and business name help. Front Porch Growth fixes those inputs and logs whether AI names you.',
    serviceName: 'AI search visibility for electricians',
    areaServed: ['Cullman', 'Huntsville', 'Gadsden', 'Birmingham', 'Alabama'],
    checksEyebrow: 'WHERE AI LOOKS',
    checksTitle: 'What AI tools can read about an electrician',
    checks: [
      'Your Google Business Profile: categories, services such as panel upgrades and generator installs, hours, and the towns you serve.',
      'License details: the name on your Alabama license should match the name on your profile, website and listings.',
      'Reviews on more than one site. In our Gadsden checks (November 2026), electrical questions got two or three names, like every other trade we checked.',
      'Pages on your own site that answer one question each, such as panel upgrade cost or whole-home generator installs, in plain words.',
    ],
    questionsTitle: 'Money questions we track for electricians',
    questions: [
      'best electrician {town}',
      'emergency electrician {town}',
      'electrical panel upgrade cost {town}',
      'whole home generator installer {town}',
      'EV charger installation {town}',
      'licensed electrician near {town}',
      'outlet not working, who do I call {town}',
      'electrical inspection for home sale {town}',
    ],
    sections: [
      { title: 'One name everywhere', body: 'The same business name, phone and address on your license record, Google profile, BBB, Angi, Nextdoor, Apple Maps and Bing Places, so AI does not see two businesses.' },
      { title: 'Answer-first service pages', body: 'Pages like “panel upgrade cost in Huntsville” and “generator install in Cullman County”, each opening with a short answer and marked up with Electrician and FAQ schema.' },
      { title: 'Storm and outage readiness', body: 'On Market Leader, after a storm that knocks out power we publish a short, factual page for the towns you serve: safety first, what to check, and how to reach you.' },
      { title: 'Honest review flow', body: 'A text-after-every-job kit and replies to every review. We never write, buy or filter reviews; the FTC banned fake reviews in 2024.' },
    ],
    faqs: [
      {
        q: 'Does my license number help AI name me?',
        a: 'We cannot promise that. It does help AI and customers confirm who you are when your license, profile and website use the same business name, and our roofing check showed AI citing license records.',
      },
      {
        q: 'Do you work with my competitor?',
        a: 'On Recommended and Market Leader we take one electrician per town, so we never work for your direct competitor there.',
      },
      NO_PROMISE,
      NOT_AFFILIATED,
    ],
    sources: [SOURCES.aecb, SOURCES.brightlocal, SOURCES.ftc],
    related: ['hvac', 'cullman-al', 'check-if-ai-recommends-you'],
  },
  {
    slug: 'dental',
    navLabel: 'Dentists',
    title: 'AI Search Visibility for Dentists | Get Named by AI',
    description:
      'Who AI names when patients ask for the best dentist in town, why great practices get left out, and the HIPAA-safe fixes that help. Checked Nov 2026.',
    eyebrow: 'AI SEARCH VISIBILITY · DENTAL',
    h1: 'AI search visibility for dental practices',
    directAnswer:
      'When a patient asks ChatGPT or Google’s AI “who is the best dentist in town?” or “who does implants near me?”, the answer usually names two to five practices. In our November 2026 checks in Alabama, Tennessee and South Carolina, practices with 5.0 ratings and hundreds of reviews sat in the map results behind the answer but were not named. The practices AI named tended to have dedicated service pages and third-party mentions. Front Porch Growth fixes what AI reads, with HIPAA-safe review replies and no outcome promises.',
    serviceName: 'AI search visibility for dental practices',
    areaServed: ['Alabama', 'United States'],
    checksTitle: 'What our dental checks showed (November 24, 2026)',
    checks: [
      '“Best dentist in Gadsden AL”: the answer named two practices. A 4.9-rated practice with more than 200 reviews, second in the map results, was not named.',
      '“Best cosmetic dentist Huntsville AL”: the answer named three practices. A 5.0-rated practice with more than 200 reviews was not named.',
      '“Best dentist Knoxville TN”: the answer named five practices. A practice with more than 1,300 reviews at 4.9 was not named.',
      '“Best dentist Chattanooga TN dental implants”: an oral surgeon with nearly 1,000 reviews was in the map results but not in the answer.',
      'These are dated single runs with an AI search tool. Answers change, which is why we track the same questions every week.',
    ],
    questionsTitle: 'Dental money questions we track',
    questions: [
      'best dentist in {town}',
      'best dentist for dental implants in {town}',
      'emergency dentist {town} open now',
      'dentist accepting new patients in {town}',
      'Invisalign dentist {town}',
      'how much are dental implants in {town}',
      'sedation dentist {town} for anxious patients',
      'dentist near {neighborhood} that takes my insurance',
    ],
    sections: [
      { title: 'Service pages AI can quote', body: 'Implants, Invisalign, emergency, cosmetic, sedation and new-patient pages that open with a direct answer, typical price ranges your office confirms, and the dentist’s credentials.' },
      { title: 'HIPAA-safe review replies', body: 'Replies never confirm someone is a patient or mention treatment. A federal regulator has settled with a dental practice over review replies that disclosed patient information.' },
      { title: 'Directories AI trusts for dentists', body: 'Google Business Profile, Healthgrades, Zocdoc, the ADA Find-a-Dentist directory, Yelp, Apple Maps and Bing Places, with the same name, phone and services everywhere.' },
      { title: 'No outcome promises', body: 'No “painless,” “guaranteed” or “best dentist” claims unless it is a named, dated award. Specialist terms only for recognized specialists. Your office approves every page.' },
    ],
    faqs: [
      {
        q: 'Do you need access to patient records?',
        a: 'No. We never need or handle patient information. Review requests go out from your own systems, and review replies are written so they never confirm someone is a patient.',
      },
      {
        q: 'What is guaranteed for a dental practice?',
        a: 'Visibility and deliverables only, not patients. ' + GUARANTEE_REGULATED,
      },
      NO_PROMISE,
      NOT_AFFILIATED,
    ],
    sources: [SOURCES.hhsNewVision, SOURCES.ftc, SOURCES.googleAiFeatures],
    related: ['med-spa', 'cost', 'check-if-ai-recommends-you'],
  },
  {
    slug: 'med-spa',
    navLabel: 'Med spas',
    title: 'AI Search Visibility for Med Spas | Get Named by AI',
    description:
      'Who AI names for “best med spa” and “best Botox” in your town, why 5.0-rated spas get skipped, and the fixes that help. Our checks, November 2026.',
    eyebrow: 'AI SEARCH VISIBILITY · MED SPA',
    h1: 'AI search visibility for med spas',
    directAnswer:
      'When someone asks an AI tool “best med spa near me” or “where should I get Botox in town?”, the answer usually names two or three spas and cites a few sources. In our November 2026 checks in Huntsville, Chattanooga, Tulsa and Boise, spas rated 4.9 to 5.0 with 150 to 480 reviews were at or near the top of the map results but left out of the answer. Front Porch Growth builds treatment pages, provider credentials and profiles AI can trust, without outcome promises.',
    serviceName: 'AI search visibility for med spas',
    areaServed: ['Alabama', 'United States'],
    checksTitle: 'What our med spa checks showed (November 24, 2026)',
    checks: [
      '“Best med spa Huntsville AL”: the answer named three spas. Two 5.0-rated spas in the map results behind it were not named.',
      '“Best med spa Chattanooga TN”: the spa listed first in the map results, rated 5.0 with more than 350 reviews, was not in the answer.',
      '“Best med spa Tulsa OK”: the answer named only two spas. Three spas rated 4.9 to 5.0 were not named.',
      '“Best med spa Gadsden AL botox”: the answer named two local spas and put one clearly first.',
      'These are dated single runs with an AI search tool. Answers change, which is why we track the same questions every week.',
    ],
    questionsTitle: 'Med spa money questions we track',
    questions: [
      'best med spa in {town}',
      'best place for Botox in {town}',
      'best lip filler {town}',
      'laser hair removal {town}',
      'how much is Botox per unit in {town}',
      'who are the injectors at {spa}',
      'medical weight loss clinic {town}',
      'HydraFacial near {neighborhood}',
    ],
    sections: [
      { title: 'One page per treatment', body: 'Botox, fillers, laser, microneedling and facials, each with a direct answer, a “starting at” price your spa confirms, downtime, who performs it, and a short FAQ.' },
      { title: 'Provider credentials up front', body: 'Who injects, their license (RN, NP, PA or MD) and supervision where your state requires it, in plain words and in structured data.' },
      { title: 'Sources AI leans on', body: 'Google Business Profile, RealSelf, manufacturer provider finders, local “best of” lists and your own site, kept consistent and complete.' },
      { title: 'Claims that stay clean', body: '“Results vary” language, no permanent or guaranteed results, drug claims within approved uses, and before-and-after photos only with written consent on file.' },
    ],
    faqs: [
      {
        q: 'Will you post on Reddit or Instagram for us?',
        a: 'We draft helpful answers and posts; you publish them from your own, disclosed accounts. We never create fake accounts or post as customers.',
      },
      {
        q: 'What is guaranteed for a med spa?',
        a: 'Visibility and deliverables only, not bookings. ' + GUARANTEE_REGULATED,
      },
      NO_PROMISE,
      NOT_AFFILIATED,
    ],
    sources: [SOURCES.ftc, SOURCES.hhsNewVision, SOURCES.googleAiFeatures],
    related: ['dental', 'cost', 'check-if-ai-recommends-you'],
  },
  {
    slug: 'law-firms',
    navLabel: 'Law firms',
    title: 'AI Search Visibility for Law Firms in Alabama',
    description:
      'Who AI names for “best injury lawyer” and “best divorce lawyer” in Alabama towns, why strong firms get left out, and fixes built to the 2026 ad rules.',
    eyebrow: 'AI SEARCH VISIBILITY · LAW FIRMS',
    h1: 'AI search visibility for law firms',
    directAnswer:
      'When someone asks an AI tool “who is the best personal injury lawyer in Gadsden?” or “best divorce lawyer in Huntsville,” the answer names three to five firms. In our November 2026 checks, firms rated 4.6 to 4.9 with 150 to 200 reviews were in the map results but not named, and the divorce firm listed first in the map results was left out too. Front Porch Growth builds educational, answer-first pages and consistent profiles AI can trust, written to Alabama’s lawyer-advertising rules as rewritten on January 1, 2026, with no promised results.',
    serviceName: 'AI search visibility for law firms',
    areaServed: ['Alabama', 'United States'],
    checksTitle: 'What our law firm checks showed (November 24, 2026)',
    checks: [
      '“Best personal injury lawyer Gadsden AL”: the answer named three firms. Three other local firms rated 4.6 to 4.9 in the map results were not named.',
      '“Best divorce lawyer Huntsville AL”: the answer named five firms. The firm listed first in the map results was not one of them.',
      '“Best personal injury lawyer Huntsville AL”: a firm whose site came up in the sources was not named in the answer.',
      '“Best car accident lawyer Omaha NE”: three firms rated 4.5 to 4.9 in the map results were not named.',
      'These are dated single runs with an AI search tool. Answers change, which is why we track the same questions every week.',
    ],
    questionsTitle: 'Law firm money questions we track',
    questions: [
      'best personal injury lawyer in {town}',
      'car accident lawyer {town}',
      'best divorce lawyer {town}',
      'child custody lawyer {town}',
      'DUI lawyer {town}',
      'what to do after a car accident in Alabama',
      'how long do I have to file an injury claim in Alabama',
      'is {firm} a good law firm',
    ],
    sections: [
      { title: 'Educational pages, not hype', body: 'Practice-area and town pages that answer real questions (deadlines, costs, what happens next) with sources, written so your own counsel can approve them quickly.' },
      { title: 'Built to the 2026 Alabama rules', body: 'No promised results; verifiable results only, by case type; testimonials only from real clients; office location stated; no “specialist” claims unless certified. We keep a dated copy of everything we publish for your records.' },
      { title: 'Profiles AI checks for lawyers', body: 'Google Business Profile, Avvo, Justia, Martindale, the State Bar directory and your attorney bios, with one consistent firm name and structured data.' },
      { title: 'Confidential review replies', body: 'Replies never confirm someone is a client or discuss a matter. Every reply points to a private phone call.' },
    ],
    faqs: [
      {
        q: 'Does Alabama still require the lawyer-advertising disclaimer?',
        a: 'Alabama’s rewritten rules, effective January 1, 2026, dropped the old general disclaimer but kept specific disclosure, record-keeping and solicitation rules. Your own counsel should confirm what applies to your firm; we build to those rules and you approve every page.',
      },
      {
        q: 'What is guaranteed for a law firm?',
        a: 'Visibility and deliverables only, never cases or results. ' + GUARANTEE_REGULATED,
      },
      NO_PROMISE,
      NOT_AFFILIATED,
    ],
    sources: [SOURCES.alRule72, SOURCES.googleAiFeatures, SOURCES.openaiSearch],
    related: ['gadsden-al', 'cost', 'check-if-ai-recommends-you'],
  },
  {
    slug: 'b2b',
    navLabel: 'B2B firms',
    title: 'AI Search Visibility for B2B Firms and Software',
    description:
      'How B2B buyers use AI shortlists, who gets named for “best IT company” or “best CPA firm,” and how to get on the list. Our checks, November 2026.',
    eyebrow: 'AI SEARCH VISIBILITY · B2B',
    h1: 'AI search visibility for B2B firms',
    directAnswer:
      'B2B buyers now ask AI tools for a shortlist (“best IT company for a small business in Huntsville,” “best CPA firm for contractors,” “alternatives to X software”) before they request a quote or a demo. The answer usually names three or four companies. In our November 2026 checks, local CPA and IT firms listed in the map results, and well-known software challengers, were left off those shortlists. Front Porch Growth builds the comparison pages, profiles and entity data AI uses to build them.',
    serviceName: 'AI search visibility for B2B firms and software companies',
    areaServed: ['Alabama', 'United States'],
    checksTitle: 'What our B2B checks showed (November 24, 2026)',
    checks: [
      '“Best CPA firm small business Huntsville AL”: the answer named three firms. Two other CPA firms in the map results were not named, one of them with FAQ structured data already on its site.',
      '“Best IT support company Huntsville AL”: an IT firm ranked third on a third-party local list was not named in the answer.',
      '“Best field service management software for a small plumbing or HVAC business”: the answer named four products; several established competitors were not on the list.',
      '“Best dental practice management software for small practices”: the answer named four products and left out other well-funded vendors.',
      'These are dated single runs with an AI search tool. Answers change, which is why we track the same questions every week.',
    ],
    questionsTitle: 'B2B questions we track',
    questions: [
      'best {category} for small business in {town}',
      'best {category} for {industry}',
      '{product} alternatives',
      '{product} vs {competitor}',
      'how much does {category} cost',
      'is {company} good',
      'best {category} software for {team size}',
      'who are the top {category} firms in {state}',
    ],
    sections: [
      { title: 'Comparison and alternatives pages', body: 'Fair, sourced “X vs Y,” “alternatives to X” and “best X for Y” pages with a check date on every competitor claim, because shortlist answers often lean on them.' },
      { title: 'Profiles buyers and AI read', body: 'Clutch, G2, Capterra, LinkedIn and your Google profile, complete and consistent, with real customer reviews only.' },
      { title: 'Entity data', body: 'Organization and service structured data, a consistent name and description everywhere, and a Wikidata entry where you qualify, so AI describes what you do correctly.' },
      { title: 'LinkedIn and video', body: 'Each answer page becomes a LinkedIn post and a short video script for your team to publish, so the same answer shows up wherever buyers look.' },
    ],
    faqs: [
      {
        q: 'Is there an add-on for B2B?',
        a: 'Yes. The B2B pack adds 4 comparison or alternatives pages a month, review-profile optimization and LinkedIn drafts on top of any plan. Ask for current pricing when you request the free Gap Report.',
      },
      {
        q: 'What is guaranteed for a B2B firm?',
        a: 'Visibility and deliverables only, not pipeline. ' + GUARANTEE_REGULATED,
      },
      NO_PROMISE,
      NOT_AFFILIATED,
    ],
    sources: [SOURCES.pew, SOURCES.googleAiFeatures, SOURCES.openaiSearch],
    related: ['aeo-vs-seo', 'cost', 'check-if-ai-recommends-you'],
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
