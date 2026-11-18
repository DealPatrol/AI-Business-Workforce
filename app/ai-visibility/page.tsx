import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { Grader } from '@/components/visibility/Grader';
import styles from '@/components/visibility/visibility.module.css';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { absoluteSiteUrl } from '@/lib/site-url';

const PATH = '/ai-visibility';
const seo = pageSeo(PATH);
const title = renderedTitle(seo);
const description = seo.description;
const CONTACT = 'hello@frontporchgrowth.com';
const mailto = (subject: string) => `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}`;

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
    images: [{ url: '/og-ai-visibility.png', width: 1200, height: 630, alt: 'Front Porch Growth free search and AI visibility grader' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/og-ai-visibility.png'] },
};

const INCLUDED = [
  { title: 'AI recommendation tracking', body: 'We ask AI assistants the questions your customers ask, like “who’s a good plumber in Cullman?”, and record whether you come up.' },
  { title: 'SEO audit', body: 'The basics Google still checks: titles, headings, speed, mobile, sitemap, and whether your pages can be listed at all.' },
  { title: 'Competitor visibility', body: 'Which nearby shops show up for the same questions, so you know who you are up against.' },
  { title: 'Business fact check', body: 'Your name, phone, address, hours, and service area, checked for the same answer everywhere they appear.' },
  { title: 'Question-to-page matching', body: 'The questions homeowners ask, lined up against the page on your site that answers them, or the gap where one should be.' },
  { title: 'Source and citation check', body: 'The websites AI assistants point to when they answer, so you can see where your name should be listed.' },
  { title: 'Change history', body: 'Every fix we make is logged with a date, next to the results that came after it.' },
];

const STEPS = [
  { n: '1', title: 'We check', body: 'A fixed set of real questions, asked on a schedule, plus a search audit of your site.' },
  { n: '2', title: 'You get one list', body: 'Search and AI results in one place, with one short to-do list, most important first.' },
  { n: '3', title: 'You approve', body: 'Nothing changes on your site or listings until you say yes to it.' },
  { n: '4', title: 'We track it', body: 'Each change sits next to what happened afterward, so you can see what helped.' },
];

type Tier = {
  name: string;
  price: number;
  who: string;
  limits: string[];
  features: string[];
  cta: { label: string; href: string };
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    name: 'Starter',
    price: 49,
    who: 'One shop, one town. See where you stand.',
    limits: ['1 location', '10 customer questions', '2 AI assistants', 'Checked once a month (20 checks)', 'Search audit of up to 25 pages'],
    features: ['Combined search + AI report', 'Prioritized fix list', 'Business fact check', 'Change history'],
    cta: { label: 'Start with the free grade', href: '#grader' },
  },
  {
    name: 'Growth',
    price: 129,
    who: 'For shops ready to fix things and track what works.',
    limits: ['1 location + 2 nearby towns', '20 customer questions', '3 AI assistants', 'Checked twice a month (120 checks)', 'Search audit of up to 100 pages'],
    features: ['Everything in Starter', 'Up to 3 competitors tracked', 'Source and citation check', 'Question-to-page matching', 'Google Search Console connection', 'Up to 4 approved improvements a month'],
    cta: { label: 'Ask about Growth', href: mailto('Growth plan: AI visibility') },
    featured: true,
  },
  {
    name: 'Agency',
    price: 299,
    who: 'Several locations, or an agency with a few clients.',
    limits: ['Up to 3 locations', '20 questions per location', '3 AI assistants', 'Checked twice a month (360 checks)', 'Search audit of up to 300 pages'],
    features: ['Everything in Growth', 'Up to 5 competitors per location', 'Report for each location', 'Up to 10 approved improvements a month'],
    cta: { label: 'Ask about Agency', href: mailto('Agency plan: AI visibility') },
  },
];

const ROADMAP = [
  { stage: 'Included now', items: ['Everything listed above, on every plan, within its limits'] },
  { stage: 'Early access', items: ['Google Search Console connection'] },
  { stage: 'Coming soon', items: ['Content drafts written for you (you approve every word)', 'Campaign results and ROI tracking'] },
  { stage: 'Later', items: ['Side-by-side experiments', 'AI crawler monitoring (Agency plan)'] },
];

const FAQS = [
  {
    q: 'What is “AI visibility,” or GEO?',
    a: 'More people now ask ChatGPT, Google’s AI answers, or other assistants who to call, instead of scrolling through a list of links. GEO (generative engine optimization) means making sure those assistants can find accurate facts about your business and have a reason to mention you. It builds on regular SEO; it does not replace it.',
  },
  {
    q: 'Can you guarantee I’ll show up in ChatGPT or rank #1 on Google?',
    a: 'No, and you should be wary of anyone who does. Search engines and AI assistants decide for themselves, and answers change from person to person and day to day. What we can do is fix what is in your control, check honestly, and show you what changed.',
  },
  {
    q: 'Is the free grade really free?',
    a: 'Yes. No card. It checks the page you enter right away, and we email you a copy. We may follow up once to see if you want help; you can ignore it.',
  },
  {
    q: 'How do the AI checks work?',
    a: 'We ask a fixed set of questions, like “who’s a good roofer in Gadsden?”, to a few AI assistants on a schedule, and save each answer. Every report lists which assistant, the exact question, the location, the date, and how many times we asked. It is a sample, not a picture of every search anyone makes.',
  },
  {
    q: 'Will you make a page for every town around me?',
    a: 'No. Pages stuffed with town names and copied text can hurt more than help. We write pages for real services and real places you work, and only after you approve them.',
  },
  {
    q: 'Do I need a new website?',
    a: 'Usually not. Most fixes are small: clearer headings, your phone and hours in the right places, a few honest answers to common questions, and consistent listings.',
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
        name: 'Search and AI visibility for home-service businesses',
        serviceType: 'SEO and generative engine optimization (GEO)',
        description,
        url,
        areaServed: { '@type': 'Country', name: 'United States' },
        provider: { '@type': 'Organization', name: 'Front Porch Growth', url: absoluteSiteUrl('/'), email: CONTACT, logo: absoluteSiteUrl('/brand-logo.png') },
        offers: TIERS.map((tier) => ({
          '@type': 'Offer',
          name: `${tier.name} (intro pricing)`,
          price: tier.price,
          priceCurrency: 'USD',
          priceSpecification: { '@type': 'UnitPriceSpecification', price: tier.price, priceCurrency: 'USD', unitText: 'MONTH' },
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: FAQS.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
      },
    ],
  };
}

export default function AiVisibilityPage() {
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()).replace(/</g, '\\u003c') }} />
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div>
            <span className={styles.eyebrow}>SEARCH + AI VISIBILITY</span>
            <h1 id="hero-title">When someone asks “who should I call?”, does your name come up?</h1>
            <p className={styles.lede}>
              Your customers still search Google. More of them now also ask ChatGPT or Google’s AI answer, and get two or three names back.
              We show you where you stand in both, in plain words, and help you fix what is keeping you out.
            </p>
            <div className={styles.actions}>
              <a className={styles.primary} href="#grader">
                Grade my site free
              </a>
              <a className={styles.secondary} href="#pricing">
                See plans
              </a>
            </div>
            <p className={styles.fine}>Free check, no card. Real results only. No ranking promises.</p>
          </div>

          <figure className={styles.demo} aria-label="Example dashboard with demo data">
            <figcaption className={styles.demoTag}>Example · demo data</figcaption>
            <div className={styles.demoHead}>
              <b>Smith Heating &amp; Air</b>
              <span>Cullman, AL · sample business</span>
            </div>
            <div className={styles.demoStats}>
              <div>
                <small>Search health</small>
                <b>72/100</b>
              </div>
              <div>
                <small>AI recommendation rate</small>
                <b>35%</b>
              </div>
            </div>
            <p className={styles.demoNote}>Example: named in 7 of 20 sample questions across 2 AI assistants.</p>
            <ol className={styles.demoList}>
              <li>
                <b>Add your hours and emergency line</b>
                <span>Business facts</span>
              </li>
              <li>
                <b>Answer “how much does a new AC cost?”</b>
                <span>Question gap</span>
              </li>
              <li>
                <b>Fix your phone number on Yelp</b>
                <span>Listing mismatch</span>
              </li>
            </ol>
          </figure>
        </section>

        <section className={styles.story} aria-labelledby="story-title">
          <h2 id="story-title">The phone used to ring from the first page of Google. Now there is a second front door.</h2>
          <div className={styles.storyCols}>
            <p>
              Picture a homeowner in Hanceville whose AC quits on a Saturday. Some will search “AC repair near me” and scroll. Others
              will open an app and type, “Who’s a good HVAC company in Cullman that can come today?” and get two or three names back.
            </p>
            <p>
              Those assistants pull from your website, your Google profile, review sites, and local listings. If your hours are missing,
              your phone number is different in three places, or nothing on your site says you serve Hanceville, they have little reason
              to mention you. Much of that is quick to fix once you can see it.
            </p>
          </div>
        </section>

        <section id="grader" className={styles.graderSection} aria-labelledby="grader-title">
          <div className={styles.graderIntro}>
            <span className={styles.eyebrow}>FREE GRADER</span>
            <h2 id="grader-title">See what search engines and AI can read about you</h2>
            <p>
              Enter your website, trade, and city. We load your page right now and run more than 20 checks that search engines and AI assistants
              rely on. You get a score, what we found, and the fixes that matter most.
            </p>
            <details className={styles.checkList}>
              <summary>What the free grade checks</summary>
              <p>
                Your phone, address, and hours; whether you say what you do and where; business schema; FAQs; answers to common customer
                questions; whether search and AI crawlers are allowed in; whether your words load without JavaScript; HTTPS; mobile setup; sitemap; robots.txt; link previews; image
                alt text; and rough speed.
              </p>
            </details>
            <p className={styles.muted}>
              The AI recommendation check uses real questions sent to real AI assistants. If it is not in your instant report, we run it
              and email you the results. We never show made-up AI answers or made-up competitors.
            </p>
          </div>
          <Grader />
        </section>

        <section className={styles.section} aria-labelledby="how-title">
          <span className={styles.eyebrow}>HOW IT WORKS</span>
          <h2 id="how-title">One dashboard. One to-do list. You stay in charge.</h2>
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
          <span className={styles.eyebrow}>WHAT’S INCLUDED</span>
          <h2 id="included-title">What we check, every month</h2>
          <div className={styles.cards}>
            {INCLUDED.map((item) => (
              <article key={item.title} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          <div className={styles.roadmap} aria-label="What is included now and what is coming">
            {ROADMAP.map((stage) => (
              <div key={stage.stage} className={styles.roadStage}>
                <h3>{stage.stage}</h3>
                <ul>
                  {stage.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.honest} aria-labelledby="honest-title">
          <div>
            <span className={styles.eyebrowLight}>HONEST REPORTING</span>
            <h2 id="honest-title">You see exactly how we checked</h2>
            <p>
              Every report lists the AI assistants we asked, the exact questions, the location, the dates, and how many times we asked.
              AI answers change from person to person and day to day, so we treat results as a sample, not a promise of how you show up
              in every search.
            </p>
          </div>
          <ul className={styles.wont}>
            <li>
              <b>No ranking guarantees.</b> Nobody controls Google or ChatGPT. We will not pretend to.
            </li>
            <li>
              <b>We don’t spam city pages.</b> No copy-paste pages for every town on the map.
            </li>
            <li>
              <b>No fake reviews or made-up results.</b> If we did not check it, it is not in your report.
            </li>
            <li>
              <b>Nothing goes live without your OK.</b> You approve every change first.
            </li>
          </ul>
        </section>

        <section id="pricing" className={styles.section} aria-labelledby="pricing-title">
          <span className={styles.eyebrow}>INTRO PRICING</span>
          <h2 id="pricing-title">Simple monthly plans, with clear limits</h2>
          <p className={styles.sectionLede}>
            Intro pricing for our first shops while we build this alongside them. These prices and limits are not permanent. If they go
            up later, we will tell you ahead of time. Month to month, cancel anytime.
          </p>
          <div className={styles.tiers}>
            {TIERS.map((tier) => (
              <article key={tier.name} className={`${styles.tier} ${tier.featured ? styles.tierFeatured : ''}`} aria-labelledby={`tier-${tier.name}`}>
                {tier.featured ? <span className={styles.badge}>Recommended</span> : null}
                <h3 id={`tier-${tier.name}`}>{tier.name}</h3>
                <p className={styles.tierWho}>{tier.who}</p>
                <p className={styles.price}>
                  <b>${tier.price}</b>/mo <span>intro price</span>
                </p>
                <h4>Limits</h4>
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
                <a className={tier.featured ? styles.primary : styles.secondary} href={tier.cta.href}>
                  {tier.cta.label}
                </a>
              </article>
            ))}
          </div>
          <div className={styles.setup}>
            <div>
              <h3>Want us to set it up with you?</h3>
              <p>
                For our first customers we offer a hands-on setup: we go through your report together, pick your questions, fix your
                business facts, and get your first improvements approved. Pricing depends on how much needs doing.
              </p>
            </div>
            <a className={styles.secondary} href={mailto('Hands-on setup: AI visibility')}>
              Ask about setup
            </a>
          </div>
          <p className={styles.fine}>
            “Checks” means one question asked to one AI assistant once. Plans are not live for checkout yet; email{' '}
            <a href={mailto('AI visibility plans')}>{CONTACT}</a> and we will get you started.
          </p>
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
          <h2 id="closing-title">Start with a free look at where you stand.</h2>
          <p>Fifteen seconds, no card. You keep the report either way.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#grader">
              Grade my site free
            </a>
            <Link className={styles.secondary} href="/google-profile">
              Or fix my Google profile ($99)
            </Link>
          </div>
        </section>
      </main>
    </SuiteShell>
  );
}
