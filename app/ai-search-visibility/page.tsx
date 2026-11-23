import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/visibility/visibility.module.css';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { absoluteSiteUrl } from '@/lib/site-url';

const PATH = '/ai-search-visibility';
const seo = pageSeo(PATH);
const title = renderedTitle(seo);
const description = seo.description;
const CONTACT = 'hello@frontporchgrowth.com';
const mailto = (subject: string, body?: string) =>
  `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
const REPORT_HREF = mailto(
  'Competitor Gap Report request',
  'Business name:\nWebsite:\nCity or towns you serve:\nTrade (HVAC, plumbing, electrical, roofing, other):\nBest phone or email to send the report to:\n',
);

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: PATH },
  openGraph: {
    title,
    description,
    url: PATH,
    siteName: 'Front Porch Growth',
    type: 'website',
    images: [{ url: '/og-ai-visibility.png', width: 1200, height: 630, alt: 'Front Porch Growth AI search visibility for HVAC, plumbing, electrical and roofing shops' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/og-ai-visibility.png'] },
};

const STEPS = [
  { n: '1', title: 'Free Gap Report', body: 'We ask AI the questions your customers ask in your town, then compare you with the shop it names: Google profile, reviews, listings, and pages. You get the 5 biggest gaps on one page.' },
  { n: '2', title: 'Pick your 10 money questions', body: 'Together we write down the questions that bring you jobs, like “who’s the best HVAC company in Gadsden?” or “emergency plumber Rainbow City”, and measure your starting point.' },
  { n: '3', title: 'We fix what AI reads', body: 'Google Business Profile, directory listings, review flow, local community answers, and answer-first pages with schema. Nothing goes live without your OK.' },
  { n: '4', title: 'We re-check and show the log', body: 'Every question, AI tool, date and answer is logged with a screenshot, so you can rerun any of it yourself.' },
];

const INCLUDED = [
  { title: 'Google Business Profile', body: 'Categories, services with price ranges, service area, after-hours, Q&A and weekly posts, because AI answers lean on map listings first.' },
  { title: 'Directories and citations', body: 'BBB, Yelp, Angi, HomeAdvisor, Nextdoor, Apple Maps, Bing Places, your chamber and home builders association, and manufacturer dealer locators, with the same name, address and phone everywhere.' },
  { title: 'Reviews and review velocity', body: 'A request link and text script for every finished job, a monthly review target, and replies to every review. We never write, buy or filter reviews.' },
  { title: 'Reddit, Facebook groups and Nextdoor', body: 'We find the local “who do you recommend?” threads and draft helpful answers you post as yourself, following each group’s rules.' },
  { title: 'Answer-first pages and schema', body: 'Cost, emergency, town and FAQ pages that open with a short answer AI can quote, plus HVACBusiness, Plumber, Electrician or RoofingContractor structured data.' },
  { title: 'Monthly AI visibility tracking', body: 'Your questions run on ChatGPT, Google AI Overviews, Perplexity and Gemini. You see how often you are named, next to the competitors named instead.' },
];

type Tier = {
  name: string;
  price: string;
  unit: string;
  who: string;
  limits: string[];
  features: string[];
  guarantee?: string;
  cta: { label: string; href: string };
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    name: 'Citation Sprint',
    price: '497',
    unit: 'one time',
    who: 'A paid first step, delivered in 10 business days.',
    limits: ['25 customer questions × 4 AI tools, 2 runs each', '1 answer-first page for your biggest gap'],
    features: ['Baseline report with the full log', 'Schema on your homepage and 1 service page', 'Google Business Profile and listings fix list', '30-minute walkthrough'],
    guarantee: '100% credited to your first month if you start a plan within 30 days.',
    cta: { label: 'Ask about the Sprint', href: mailto('AI Citation Sprint ($497)') },
  },
  {
    name: 'Found',
    price: '1,500',
    unit: '/mo',
    who: 'One shop, one metro plus nearby towns.',
    limits: ['30 questions incl. 10 money questions, checked monthly on 4 AI tools', '4 answer-first pages a month', 'Up to 15 listing fixes a month'],
    features: ['Google Business Profile managed, 4 posts a month', 'Review flow with a 4+ a month target', 'Monthly Reddit, Facebook group and Nextdoor scan', 'Monthly visibility report'],
    guarantee: 'Day-90 target: +10 points of citation share, or named on 3 of your 10 money questions.',
    cta: { label: 'Ask about Found', href: mailto('Found plan: AI search visibility') },
  },
  {
    name: 'Recommended',
    price: '2,750',
    unit: '/mo',
    who: 'Established shops serving 2–4 towns or 2 service lines.',
    limits: ['60 questions, checked twice a month', '8 answer-first pages a month', 'Up to 30 listing fixes a month'],
    features: ['Everything in Found', 'Manufacturer locators, chamber and HBA listings', '8+ reviews a month target and reply service', '1–2 local authority placements a month', 'One shop per trade per town'],
    guarantee: 'Day-90 target: +15 points, or named on 5 of your 10 money questions.',
    cta: { label: 'Ask about Recommended', href: mailto('Recommended plan: AI search visibility') },
    featured: true,
  },
  {
    name: 'Market Leader',
    price: '4,500',
    unit: '/mo',
    who: 'Multi-location shops, or one that wants a whole region.',
    limits: ['120 questions, checked weekly', '16 answer-first pages a month', '5 named competitors tracked'],
    features: ['Everything in Recommended', 'Weather-event pages within 48 hours', 'Quarterly local data story', '3 authority placements a month', 'One shop per trade per region'],
    guarantee: 'Day-90 target: +20 points and named on 6 of your 10 money questions.',
    cta: { label: 'Ask about Market Leader', href: mailto('Market Leader plan: AI search visibility') },
  },
];

const FAQS = [
  {
    q: 'What is AI search visibility?',
    a: 'When a homeowner asks ChatGPT, Google’s AI Overviews or Perplexity “who should I call to fix my AC?” or “who’s a good electrician near me?”, the answer names two or three companies and cites a few websites. AI search visibility is the work of making your company one of the names, with pages and listings those tools can read and trust. Some people call it AEO or GEO.',
  },
  {
    q: 'What is in the free Competitor Gap Report?',
    a: 'One page: who AI names for 8 questions your customers ask, how your Google profile, reviews and listings compare with the shop it names, which sites the answers cited, and the 5 fixes that matter most. It is free and yours to keep.',
  },
  {
    q: 'What exactly is guaranteed?',
    a: 'Not rankings. In week 1 we agree in writing on your questions, including 10 money questions you pick, and measure your citation share: the share of runs where you are named in the answer or your site is cited. By day 90 you hit your plan’s target: +10 points or named on 3 of 10 money questions (Found), +15 points or 5 of 10 (Recommended), or +20 points and 6 of 10 (Market Leader), measured the same way. If we miss, we keep doing the monthly work free for up to 90 more days, and if it is still not met at day 180 we refund your third month. You give us Google Business Profile access and approve drafts within 5 business days.',
  },
  {
    q: 'Can I pay only once AI names me?',
    a: 'Yes, on Found and Recommended. With Pay When Named you pay the $497 setup, then nothing monthly until you are named on 3 of your 10 money questions in our logged checks. After that, Found is $1,750 a month and Recommended is $3,000, with a 3-month minimum. If it has not happened by day 90, you owe nothing more and keep everything we built. We take a few of these a month.',
  },
  {
    q: 'Do you promise #1 in ChatGPT or Google?',
    a: 'No. AI answers change from one run to the next and nobody controls them. We promise the measured number above, with the full log shared with you, and we never promise a ranking, traffic or revenue.',
  },
  {
    q: 'Which businesses do you work with?',
    a: 'Local trades and home services in Alabama: HVAC, plumbing and septic, electrical, roofing, and similar shops in Gadsden and Etowah County, Cullman, Huntsville and the Birmingham area. On Recommended and Market Leader we take one shop per trade per town, so we never work for your direct competitor there.',
  },
  {
    q: 'Are you affiliated with OpenAI, Google or Perplexity?',
    a: 'No. ChatGPT, Google AI Overviews and Perplexity are trademarks of their owners. We test how their public answers describe local businesses; we do not have special access.',
  },
];

function jsonLd() {
  const url = absoluteSiteUrl(PATH);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        isPartOf: { '@type': 'WebSite', name: 'Front Porch Growth', url: absoluteSiteUrl('/') },
      },
      {
        '@type': 'Service',
        '@id': `${url}#service`,
        name: 'AI search visibility for local trades: HVAC, plumbing, electrical and roofing',
        serviceType: 'Answer engine optimization (AEO) for local service businesses',
        description,
        url,
        areaServed: { '@type': 'State', name: 'Alabama' },
        provider: { '@type': 'Organization', name: 'Front Porch Growth', url: absoluteSiteUrl('/'), email: CONTACT },
        offers: [
          { '@type': 'Offer', name: 'AI Visibility Gap Report', price: 0, priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Pay When Named setup', price: 497, priceCurrency: 'USD' },
          ...TIERS.map((tier) => ({
            '@type': 'Offer',
            name: tier.name,
            price: Number(tier.price.replace(',', '')),
            priceCurrency: 'USD',
            ...(tier.unit === '/mo'
              ? { priceSpecification: { '@type': 'UnitPriceSpecification', price: Number(tier.price.replace(',', '')), priceCurrency: 'USD', unitText: 'MONTH' } }
              : {}),
          })),
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: FAQS.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
      },
    ],
  };
}

export default function AiSearchVisibilityPage() {
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()).replace(/</g, '\\u003c') }} />
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div>
            <span className={styles.eyebrow}>AI SEARCH VISIBILITY · HVAC · PLUMBING · ELECTRICAL · ROOFING</span>
            <h1 id="hero-title">When a neighbor asks AI who to call, your shop should be one of the names.</h1>
            <p className={styles.lede}>
              We help Alabama HVAC, plumbing, electrical and roofing shops get named and cited by ChatGPT, Google AI Overviews and
              Perplexity, through your Google profile, listings, reviews, local groups and your own site. Start with a free Gap Report that
              shows who AI names in your town and why.
            </p>
            <div className={styles.actions}>
              <a className={styles.primary} href={REPORT_HREF}>
                Request my free Gap Report
              </a>
              <a className={styles.secondary} href="#pricing">
                See plans
              </a>
            </div>
            <p className={styles.fine}>Free report, no card, yours to keep. Written 90-day targets, or pay only once you’re named.</p>
          </div>
        </section>

        <section className={styles.story} aria-labelledby="story-title">
          <h2 id="story-title">The shop AI names is usually the one with the clearest profile and listings, not the best crew.</h2>
          <div className={styles.storyCols}>
            <p>
              More people now ask an AI app “who’s the best HVAC company in Gadsden?” or “emergency plumber near me” and get two or three
              names back. Those tools read Google Business Profiles, review counts, BBB, Angi, Yelp, Nextdoor, “best of” lists and websites.
            </p>
            <p>
              In our November 2026 checks of Gadsden-area HVAC, plumbing and electrical questions, the answers named shops with strong
              map listings and leaned on directory lists, while several well-reviewed local shops with thin websites or mismatched
              addresses were left out.
            </p>
            <p>
              The fixes are specific: a complete Google profile, matching listings, steady honest reviews, helpful answers in local groups,
              and pages that answer cost and emergency questions for your towns. We do the work and show you every check.
            </p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="how-title">
          <span className={styles.eyebrow}>HOW IT WORKS</span>
          <h2 id="how-title">Report first. Then a measured plan.</h2>
          <ol className={styles.steps}>
            {STEPS.map((step) => (
              <li key={step.n}>
                <span className={styles.stepNum} aria-hidden="true">
                  {step.n}
                </span>
                <b>{step.title}</b>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="included-title">
          <span className={styles.eyebrow}>WHAT WE DO</span>
          <h2 id="included-title">Everything AI reads before it names a shop</h2>
          <div className={styles.cards}>
            {INCLUDED.map((item) => (
              <article key={item.title} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className={styles.section} aria-labelledby="pricing-title">
          <span className={styles.eyebrow}>PLANS</span>
          <h2 id="pricing-title">Fixed scope, published prices</h2>
          <p className={styles.sectionLede}>
            Monthly plans have a 90-day first term (the guarantee needs it), then month to month with 30 days’ notice. Billed upfront each
            month. You own every page, schema and listing we create.
          </p>
          <div className={styles.tiers}>
            {TIERS.map((tier) => (
              <article key={tier.name} className={`${styles.tier} ${tier.featured ? styles.tierFeatured : ''}`} aria-labelledby={`tier-${tier.name}`}>
                {tier.featured ? <span className={styles.badge}>Most shops</span> : null}
                <h3 id={`tier-${tier.name}`}>{tier.name}</h3>
                <p className={styles.tierWho}>{tier.who}</p>
                <p className={styles.price}>
                  <b>${tier.price}</b>
                  {tier.unit === '/mo' ? '/mo' : <span> {tier.unit}</span>}
                </p>
                <h4>Scope</h4>
                <ul className={styles.limits}>
                  {tier.limits.map((limit) => (
                    <li key={limit}>{limit}</li>
                  ))}
                </ul>
                <h4>Includes</h4>
                <ul className={styles.features}>
                  {tier.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {tier.guarantee ? <p className={styles.fine}>{tier.guarantee}</p> : null}
                <a className={tier.featured ? styles.primary : styles.secondary} href={tier.cta.href}>
                  {tier.cta.label}
                </a>
              </article>
            ))}
          </div>
          <article className={styles.card} style={{ marginTop: 24 }} aria-labelledby="pay-when-named">
            <h3 id="pay-when-named">Pay When Named</h3>
            <p>
              Prefer to pay for results? On Found or Recommended, pay the $497 setup, then nothing monthly until you are named on 3 of
              your 10 money questions in our logged checks. Then it is $1,750 a month (Found) or $3,000 (Recommended), 3-month minimum.
              Not named by day 90? You owe nothing more. Limited spots each month.{' '}
              <a href={mailto('Pay When Named: AI search visibility')}>Ask about Pay When Named</a>.
            </p>
          </article>
          <p className={styles.fine}>
            “Citation share” is the share of question runs where you are named in the answer or your site is cited. Targets are measured
            against your week-1 baseline, as the average of days 76–90. Plans are not open for online checkout yet; email{' '}
            <a href={mailto('AI search visibility plans')}>{CONTACT}</a>.
          </p>
        </section>

        <section className={styles.honest} aria-labelledby="honest-title">
          <div>
            <span className={styles.eyebrowLight}>THE GUARANTEE, PLAINLY</span>
            <h2 id="honest-title">A measured number, not a ranking promise</h2>
            <p>
              Miss your 90-day target (citation-share points or money questions named) and we keep doing the full monthly work free for up
              to 90 more days. Still short at day 180, we refund your third month. Or choose Pay When Named and skip the monthly bill until
              you are named. Every run is logged with the date, AI tool, answer and screenshot.
            </p>
          </div>
          <ul className={styles.wont}>
            <li>
              <b>No #1 promises.</b> AI answers change run to run. Nobody controls them.
            </li>
            <li>
              <b>No fake reviews.</b> We never write, buy or filter reviews.
            </li>
            <li>
              <b>No copy-paste town pages.</b> Each page has real local facts.
            </li>
            <li>
              <b>Nothing goes live without your OK.</b> You approve every draft.
            </li>
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="faq-title">
          <span className={styles.eyebrow}>QUESTIONS</span>
          <h2 id="faq-title">Straight answers</h2>
          <div className={styles.faq}>
            {FAQS.map((faq) => (
              <details key={faq.q}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <h2 id="closing-title">See who AI names in your town, and what it would take to add you.</h2>
          <p>Send your business name, website and town. Cole Collins, Front Porch Growth, Hanceville, Alabama.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href={REPORT_HREF}>
              Request my free Gap Report
            </a>
            <Link className={styles.secondary} href="/ai-visibility">
              Or grade my site free
            </Link>
          </div>
        </section>
      </main>
    </SuiteShell>
  );
}
