import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { InvoicingWaitlistForm } from '@/components/suite/InvoicingWaitlistForm';
import avaStyles from '@/components/ava-home/ava-home.module.css';
import { DESK_TOOLS } from '@/lib/desk-tools';
import { frontPorchLocalBusiness, faqNode } from '@/lib/ava/structured-data';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { FRONT_PORCH_GROWTH_ORIGIN } from '@/lib/site-url';
import fpg from '@/components/fpg/fpg.module.css';
import { ClosingCards } from '@/components/fpg/Blocks';
import { FPG_COMPARE_CHECKED_LABEL } from '@/lib/fpg/competitors';
import { ER_HOME, FPG_FREE_TOOLS, FPG_PUBLIC_PHONE, FPG_PUBLIC_PHONE_HREF, FPG_SERVICES, fpgIndustries } from '@/lib/fpg/site';

const seo = pageSeo('/');
const title = renderedTitle(seo);
const description = seo.description;

const HOME_FAQS = [
  {
    q: 'What is Front Porch Growth?',
    a: 'Front Porch Growth is a set of marketing tools for home-service shops: done-for-you AI Search Visibility (roofing first), YardMailer postcards, Google Business Profile setup, a free SEO and AI-visibility grader, Lead Scout, and review-request tools. Cole Collins built it in Hanceville, Alabama.',
  },
  {
    q: 'Where is the AI receptionist?',
    a: 'Ava, the AI receptionist, lives at Executive Receptionist (executivereceptionist.com). Front Porch Growth links there instead of republishing that product. Starter on that site is $79 a month, and Starter is the only plan whose first month is $1.',
  },
  {
    q: 'What does a YardMailer postcard cost?',
    a: 'Setup is $127 once, then $3.54 per 4x6 card or $4.95 per 6x9. You approve the design, the audience, and the cost before anything is mailed. Details are on the pricing page.',
  },
  {
    q: 'Is the AI visibility grader free?',
    a: 'Yes. You can grade a site at /ai-visibility without an account. It does not promise rankings or traffic.',
  },
  {
    q: 'Do you guarantee Google or AI-search rankings?',
    a: 'No. The free grader and checklist tell you what is missing; they do not promise a position in Google or in ChatGPT answers. The done-for-you AI Search Visibility plans carry a measured citation-share target instead of a ranking promise, explained on that page.',
  },
  {
    q: 'How do review requests work?',
    a: 'ReputationFlow gives you a link and a QR code so customers can leave an honest public review. The free tool is at tryreputationflow.com. Front Porch Growth also has a Reputation page that explains the paid option.',
  },
  {
    q: 'How do I get started?',
    a: 'Pick one service. Grade your site free, request a free AI Competitor Gap Report, order a postcard run from 100 cards, or book the $99 Google profile setup. Nothing is mailed, published or charged on a plan until you approve it.',
  },
  {
    q: 'How do your prices compare?',
    a: 'The compare pages put each service next to a named alternative, such as Local SEO Bot, BrightLocal, PostcardMania, USPS EDDM, AEO Engine, Otterly.ai and NiceJob, using prices from their own pages and saying where the other option is the better pick.',
  },
] as const;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/' },
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'Front Porch Growth',
    type: 'website',
    images: [{ url: '/og-home.png', width: 1200, height: 630, alt: 'Front Porch Growth tools for home-service shops' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-home.png'],
  },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    frontPorchLocalBusiness(),
    {
      '@type': 'WebSite',
      name: 'Front Porch Growth',
      url: `${FRONT_PORCH_GROWTH_ORIGIN}/`,
      publisher: { '@id': `${FRONT_PORCH_GROWTH_ORIGIN}/#org` },
    },
    faqNode([...HOME_FAQS]),
  ],
};

const REASONS = [
  {
    title: 'Every price is published',
    detail: 'Postcards, the Google profile setup, AI search plans and review tools all show their price before you talk to anyone. No retainer quote to decode.',
  },
  {
    title: 'You approve before anything goes out',
    detail: 'Postcards mail only after you approve the design, the streets and the cost. Pages and profile changes go live only with your OK.',
  },
  {
    title: 'No ranking promises, real logs instead',
    detail: 'Nobody can promise a spot on Google or in ChatGPT. You get the checks, the logged answers and what changed, so you can rerun them yourself.',
  },
];

const STEPS = [
  { title: 'Start free', detail: 'Grade your site, or ask for the free AI Competitor Gap Report. No card.' },
  { title: 'Pick one service', detail: 'A postcard run, a $99 Google profile fix, review requests, or an AI search plan.' },
  { title: 'Approve the work', detail: 'See the card, the profile changes or the pages before they go out.' },
  { title: 'See what happened', detail: 'QR estimate requests, review links and the AI search log show the results in plain words.' },
];

const COMPARE_ROWS = [
  { need: 'Google Business Profile', us: '$99 once, done for you', them: 'Local SEO Bot $99/mo per location · BrightLocal from $41/mo billed monthly', href: '/compare/front-porch-growth-vs-local-seo-bot' },
  { need: 'Postcards', us: '$3.54–$4.95 per card, postage included, + $127 setup once', them: 'PostcardMania prints from $0.12 a card, postage quoted separately · USPS EDDM postage $0.260 a piece, you print and drop off', href: '/compare/yardmailer-vs-postcardmania' },
  { need: 'AI search visibility', us: 'Free Gap Report · $497 Sprint · from $1,500/mo', them: 'AEO Engine from $1,597/mo with a 90-day term · Otterly.ai tracking from €29/mo, you do the fixes', href: '/compare/front-porch-growth-vs-aeo-engine' },
  { need: 'Review requests', us: 'Free starter or $20/mo (ReputationFlow)', them: 'NiceJob $95 or $135/mo', href: '/compare/front-porch-growth-vs-nicejob' },
];

export default function SuiteHomePage() {
  const industries = fpgIndustries();
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, '\\u003c') }} />
      <div className={fpg.wrap}>
        <section className={fpg.hero} id="start">
          <span className={fpg.eyebrow}>Front Porch Growth · Marketing for home-service shops</span>
          <h1>Get found, and get picked, by the homeowners near you.</h1>
          <p className={fpg.lede}>
            Postcards that show a homeowner a project for their own house, a Google profile set up right, honest review requests, and AI search work
            so ChatGPT and Google’s AI can name your shop. Published prices, and nothing goes out until you approve it.
          </p>
          <div className={fpg.actions}>
            <Link className={fpg.primary} href="/ai-visibility">
              Grade my site free
            </Link>
            <Link className={fpg.secondary} href="/ai-search-visibility">
              Get a free AI Gap Report
            </Link>
            <Link className={fpg.secondary} href="/pricing">
              See prices
            </Link>
          </div>
          <p className={fpg.fine}>
            Questions first? Call <a href={FPG_PUBLIC_PHONE_HREF}>{FPG_PUBLIC_PHONE}</a>. Need the phone answered instead? That is our sister brand,{' '}
            <a href={ER_HOME}>Executive Receptionist</a>.
          </p>
        </section>

        <section className={fpg.section} id="why">
          <span className={fpg.kicker}>Why shops switch from an agency retainer</span>
          <h2 className={fpg.h2}>Three things you can check before you pay.</h2>
          <ul className={fpg.grid3}>
            {REASONS.map((reason, index) => (
              <li className={fpg.card} key={reason.title}>
                <span className={fpg.num}>{index + 1}</span>
                <h3>{reason.title}</h3>
                <p>{reason.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={fpg.section} id="what-you-get">
          <span className={fpg.kicker}>What lands on your desk</span>
          <h2 className={fpg.h2}>See the work before you buy it.</h2>
          <p className={fpg.body}>Samples below use made-up businesses and numbers, so you can see the format of what you would get.</p>
          <ul className={fpg.grid3}>
            <li className={fpg.sample}>
              <span className={fpg.tag}>Sample postcard</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/postcard-yard.png" alt="Sample YardMailer concept: the same front yard now and after the project" width={512} height={512} style={{ width: '100%', height: 'auto', borderRadius: 12 }} loading="lazy" />
              <p className={fpg.fine}>A concept for that home, plus a QR code to an estimate-request page.</p>
            </li>
            <li className={fpg.sample}>
              <span className={fpg.tag}>Sample AI Gap Report · made-up data</span>
              <table>
                <thead>
                  <tr>
                    <th>Check</th>
                    <th>You</th>
                    <th>Named roofer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Pages on site</td><td>18</td><td>240</td></tr>
                  <tr><td>Town pages</td><td>0</td><td>12</td></tr>
                  <tr><td>Cost page</td><td>No</td><td>Yes</td></tr>
                  <tr><td>Insurance-claim guide</td><td>No</td><td>Yes</td></tr>
                  <tr><td>Named in AI answers</td><td>0 of 8</td><td>5 of 8</td></tr>
                </tbody>
              </table>
              <p className={fpg.fine}>Five biggest gaps on one page, free. <Link href="/ai-search-visibility">How it works</Link>.</p>
            </li>
            <li className={fpg.sample}>
              <span className={fpg.tag}>Sample Google profile checklist</span>
              <ul className={fpg.list}>
                <li>Primary category matches the trade</li>
                <li>Services listed with short descriptions</li>
                <li>Service area instead of a home address</li>
                <li>Real job photos uploaded</li>
                <li>Review link and QR code ready to share</li>
              </ul>
              <p className={fpg.fine}>Done once for $99. <Link href="/google-profile">What is included</Link>.</p>
            </li>
          </ul>
        </section>

        <section className={fpg.section} id="services">
          <span className={fpg.kicker}>Services</span>
          <h2 className={fpg.h2}>Pick the one that fixes your slowest week.</h2>
          <ul className={fpg.grid3}>
            {FPG_SERVICES.map((service) => (
              <li key={service.href}>
                <Link className={fpg.card} href={service.href}>
                  <h3>{service.label}</h3>
                  <p>{service.detail}</p>
                  <span className={fpg.price}>{service.price}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={fpg.section} id="compare">
          <span className={fpg.kicker}>Compared</span>
          <h2 className={fpg.h2}>Front Porch Growth next to the usual options.</h2>
          <div className={fpg.tableWrap}>
            <table className={fpg.table}>
              <thead>
                <tr>
                  <th scope="col">What you need</th>
                  <th scope="col">Front Porch Growth</th>
                  <th scope="col">Published alternatives</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.need}>
                    <td>
                      <Link href={row.href}>{row.need}</Link>
                    </td>
                    <td>{row.us}</td>
                    <td>{row.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={fpg.fine}>
            Alternative prices from each company’s own pricing page, checked {FPG_COMPARE_CHECKED_LABEL}. <Link href="/compare">See every comparison</Link>, including where the
            other option is the better pick.
          </p>
        </section>

        <section className={fpg.section} id="how">
          <span className={fpg.kicker}>How it works</span>
          <h2 className={fpg.h2}>Four steps, and you approve each one.</h2>
          <ol className={fpg.grid3} style={{ listStyle: 'none' }}>
            {STEPS.map((step, index) => (
              <li className={fpg.card} key={step.title}>
                <span className={fpg.num}>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={fpg.section} id="industries">
          <span className={fpg.kicker}>Industries</span>
          <h2 className={fpg.h2}>Built around your trade.</h2>
          <ul className={fpg.linkList}>
            {industries.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
          <p className={fpg.fine}>
            <Link href="/trades">All industries</Link>
          </p>
        </section>

        <section className={fpg.section} id="tools">
          <span className={fpg.kicker}>Free tools</span>
          <h2 className={fpg.h2}>Free, no card, nothing sent.</h2>
          <ul className={fpg.grid3}>
            {FPG_FREE_TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link className={fpg.card} href={tool.href}>
                  <h3>{tool.label}</h3>
                  <p>{tool.detail}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={fpg.section} id="desk">
          <span className={fpg.kicker}>Your desk</span>
          <h2 className={fpg.h2}>Leads, campaigns, and writing tools in one place.</h2>
          <p className={fpg.body}>
            Sign in to your desk to open the Front Porch Growth tools you already use. Buying a postcard campaign or grading a site does not always
            need an account first.
          </p>
          <ul className={avaStyles.tiles}>
            {DESK_TOOLS.map((tool) => (
              <li key={tool.key} id={tool.key === 'invoices' ? 'invoicing' : undefined}>
                {tool.key === 'invoices' ? (
                  <div className={avaStyles.tile}>
                    <h3>{tool.name}</h3>
                    <p>{tool.what}</p>
                    <InvoicingWaitlistForm />
                  </div>
                ) : (
                  <Link className={avaStyles.tile} href={tool.href}>
                    <h3>{tool.name}</h3>
                    <p>{tool.what}</p>
                    <span className={`${avaStyles.tileMeta} ${tool.status === 'live' ? avaStyles.tileMetaLive : ''}`}>
                      {tool.status === 'waitlist' ? 'Waitlist' : tool.signedIn ? 'In your desk' : 'Open'}
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className={fpg.actions}>
            <Link className={fpg.secondary} href="/login?next=/desk">
              Sign in to your desk
            </Link>
          </div>
        </section>

        <section className={fpg.section} id="faq">
          <span className={fpg.kicker}>Straight answers</span>
          <h2 className={fpg.h2}>Before you pick a service.</h2>
          <div className={fpg.faq}>
            {HOME_FAQS.map((faq) => (
              <details key={faq.q}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={fpg.section} id="receptionist">
          <span className={fpg.kicker}>Sister brand</span>
          <h2 className={fpg.h2}>Missing calls? That is Executive Receptionist.</h2>
          <p className={fpg.body}>
            The AI receptionist, Ava, has her own site with her own plans and demo. Front Porch Growth links there instead of repeating it here.
          </p>
          <div className={fpg.actions}>
            <a className={fpg.secondary} href={ER_HOME}>
              Go to Executive Receptionist
            </a>
          </div>
        </section>

        <ClosingCards heading="Start free, or start with one service." />
      </div>
    </SuiteShell>
  );
}
