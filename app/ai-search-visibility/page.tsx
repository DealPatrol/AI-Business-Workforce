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
  'Business name:\nWebsite:\nCity or towns you serve:\nTrade (roofing, HVAC, other):\nBest phone or email to send the report to:\n',
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
    images: [{ url: '/og-ai-visibility.png', width: 1200, height: 630, alt: 'Front Porch Growth AI search visibility for roofers' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/og-ai-visibility.png'] },
};

const STEPS = [
  { n: '1', title: 'Free Competitor Gap Report', body: 'We compare your site with the roofer AI names in your town: page counts, town pages, cost and FAQ pages, and which sites the answers cite. You get the 5 biggest gaps on one page.' },
  { n: '2', title: 'Agree on your questions', body: 'Together we write down the questions your customers ask AI, like “who fixes hail damage roofs in Gadsden?”, and measure your starting point.' },
  { n: '3', title: 'We fix what AI reads', body: 'Answer-first pages, schema, Google Business Profile, directory listings, and an honest review-request flow. Nothing goes live without your OK.' },
  { n: '4', title: 'We re-check and show the log', body: 'Every question, AI tool, date and answer is logged with a screenshot, so you can rerun any of it yourself.' },
];

const INCLUDED = [
  { title: 'Answer-first pages', body: 'Cost, storm damage, insurance claim, FAQ and real town pages, each opening with a short, sourced answer an AI can quote.' },
  { title: 'Schema and AI-crawler setup', body: 'RoofingContractor, Service and FAQ structured data, robots rules that let AI search crawlers in, llms.txt and a clean sitemap.' },
  { title: 'Google Business Profile', body: 'Categories, services, service area and posts kept current, because AI answers lean on map listings.' },
  { title: 'Listings AI cites', body: 'BBB, Angi, HomeAdvisor, Yelp, Bing, Apple and manufacturer contractor locators, with the same name, address and phone everywhere.' },
  { title: 'Honest reviews', body: 'A request link after each finished job. We never write, buy or filter reviews.' },
  { title: 'Monthly citation-share report', body: 'How often you are named or cited across your questions and AI tools, next to the competitors named instead.' },
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
    limits: ['25 buyer questions × 4 AI tools, 2 runs each', '1 answer-first page for your biggest gap'],
    features: ['Baseline citation report with the full log', 'Schema on your homepage and 1 service page', 'Google Business Profile and directory fix list', '30-minute walkthrough'],
    guarantee: '100% credited to your first month if you start a plan within 30 days.',
    cta: { label: 'Ask about the Sprint', href: mailto('AI Citation Sprint ($497)') },
  },
  {
    name: 'Found',
    price: '1,500',
    unit: '/mo',
    who: 'One roofer, one metro plus nearby towns.',
    limits: ['30 questions, checked monthly on 4 AI tools', '4 answer-first pages a month', 'Up to 15 listing fixes a month'],
    features: ['Site-wide schema and AI-crawler setup', 'Google Business Profile managed', 'Review-request flow', 'Monthly citation-share report'],
    guarantee: 'Target: +10 points of citation share by day 90.',
    cta: { label: 'Ask about Found', href: mailto('Found plan: AI search visibility') },
  },
  {
    name: 'Recommended',
    price: '2,750',
    unit: '/mo',
    who: 'Established roofers serving 2–4 cities.',
    limits: ['60 questions, checked twice a month', '8 answer-first pages a month', 'Up to 30 listing fixes a month'],
    features: ['Everything in Found', 'Manufacturer locator and chamber listings', '1–2 local authority placements a month', 'One roofer per city'],
    guarantee: 'Target: +15 points of citation share by day 90.',
    cta: { label: 'Ask about Recommended', href: mailto('Recommended plan: AI search visibility') },
    featured: true,
  },
  {
    name: 'Market Leader',
    price: '4,500',
    unit: '/mo',
    who: 'Multi-location roofers, or one that wants a whole region.',
    limits: ['120 questions, checked weekly', '16 answer-first pages a month', '5 named competitors tracked'],
    features: ['Everything in Recommended', 'Storm pages within 48 hours of a qualifying storm', 'Quarterly local data story', 'One roofer per region'],
    guarantee: 'Target: +20 points by day 90 and named on 3 of your 5 money questions.',
    cta: { label: 'Ask about Market Leader', href: mailto('Market Leader plan: AI search visibility') },
  },
];

const FAQS = [
  {
    q: 'What is AI search visibility?',
    a: 'When a homeowner asks ChatGPT, Google’s AI Overviews or Perplexity “who should I call to replace my roof?”, the answer names two or three companies and cites a few websites. AI search visibility is the work of making your company one of the names, with pages and listings those tools can read and trust. Some people call it AEO or GEO.',
  },
  {
    q: 'What is in the free Competitor Gap Report?',
    a: 'One page: how many pages your site has next to the roofer AI names in your town, how many town, cost and FAQ pages each of you has, which sites the AI answers cited, and the 5 questions homeowners ask that a competitor answers and you don’t. It is free and yours to keep.',
  },
  {
    q: 'What exactly is guaranteed?',
    a: 'Not rankings. In week 1 we agree in writing on your questions and measure your citation share: the share of runs where you are named in the answer or your site is cited. By day 90 it should be your baseline plus 10, 15 or 20 points, depending on the plan, measured the same way. If we miss, we keep doing the monthly work at no charge for up to 90 more days, and if it is still not met at day 180 we refund your third month. You need to give us Google Business Profile access and approve drafts within 5 business days.',
  },
  {
    q: 'Do you promise #1 in ChatGPT or Google?',
    a: 'No. AI answers change from one run to the next and nobody controls them. We promise the measured number above, with the full log shared with you, and we never promise a ranking, traffic or revenue.',
  },
  {
    q: 'Why roofing first?',
    a: 'One replacement job is worth months of service, storm season sends homeowners straight to “who can fix this?” questions, and in our checks most Gadsden-area roofer websites had few or no cost, insurance-claim or town pages. HVAC is next.',
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
        name: 'AI search visibility for roofing companies',
        serviceType: 'Answer engine optimization (AEO) for local service businesses',
        description,
        url,
        areaServed: { '@type': 'State', name: 'Alabama' },
        provider: { '@type': 'Organization', name: 'Front Porch Growth', url: absoluteSiteUrl('/'), email: CONTACT },
        offers: [
          { '@type': 'Offer', name: 'Competitor Gap Report', price: 0, priceCurrency: 'USD' },
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
            <span className={styles.eyebrow}>AI SEARCH VISIBILITY · ROOFING FIRST</span>
            <h1 id="hero-title">When a homeowner asks AI for a roofer, your company should be one of the names.</h1>
            <p className={styles.lede}>
              We help local service businesses, starting with roofers, get recommended and cited by ChatGPT, Google AI Overviews and
              Perplexity. Start with a free Competitor Gap Report that shows who AI names in your town and why.
            </p>
            <div className={styles.actions}>
              <a className={styles.primary} href={REPORT_HREF}>
                Request my free Gap Report
              </a>
              <a className={styles.secondary} href="#pricing">
                See plans
              </a>
            </div>
            <p className={styles.fine}>Free report, no card, yours to keep. Measured targets, never ranking promises.</p>
          </div>
        </section>

        <section className={styles.story} aria-labelledby="story-title">
          <h2 id="story-title">The roofer AI names is usually the one with the clearest pages, not the best crew.</h2>
          <div className={styles.storyCols}>
            <p>
              After a hailstorm, more homeowners type “who fixes hail damage roofs near me?” into an AI app and get two or three names
              back. Those tools read websites, Google Business Profiles, BBB, Angi, HomeAdvisor and “best roofer” lists.
            </p>
            <p>
              In our November 2026 scan of North Alabama roofer websites, several Gadsden-area roofers had fewer than 25 pages, with few
              or no cost and town pages, while the Birmingham leaders had hundreds. That gap is what AI notices.
            </p>
            <p>
              The fixes are specific: a cost page for your town, an insurance-claim guide, real service-area pages, matching listings, and
              steady honest reviews. We do the work and show you every check.
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
          <h2 id="included-title">Everything AI reads before it names a roofer</h2>
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
                {tier.featured ? <span className={styles.badge}>Most roofers</span> : null}
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
              Miss the 90-day citation-share target and we keep doing the full monthly work free for up to 90 more days. Still short at day
              180, we refund your third month. Every run is logged with the date, AI tool, answer and screenshot.
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
