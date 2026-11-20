import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { SisterSites } from '@/components/seo/SisterSites';
import styles from '@/components/suite/home.module.css';
import { InvoicingWaitlistForm } from '@/components/suite/InvoicingWaitlistForm';
import avaStyles from '@/components/ava-home/ava-home.module.css';
import { DESK_TOOLS } from '@/lib/desk-tools';
import { frontPorchLocalBusiness, faqNode } from '@/lib/ava/structured-data';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { FRONT_PORCH_GROWTH_ORIGIN } from '@/lib/site-url';

const seo = pageSeo('/');
const title = renderedTitle(seo);
const description = seo.description;

const HOME_FAQS = [
  {
    q: 'What is Front Porch Growth?',
    a: 'Front Porch Growth is a set of marketing tools for home-service shops: YardMailer postcards, Google Business Profile setup, a free SEO and AI-visibility grader, Lead Scout, and review-request tools. Cole Collins built it in Hanceville, Alabama.',
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
    a: 'No. The grader and the checklist tell you what is missing. They do not promise a position in Google or in ChatGPT answers.',
  },
  {
    q: 'How do review requests work?',
    a: 'ReputationFlow gives you a link and a QR code so customers can leave an honest public review. The free tool is at tryreputationflow.com. Front Porch Growth also has a Reputation page that explains the paid option.',
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

const TOOLS = [
  {
    href: '/postcards',
    title: 'YardMailer postcards',
    detail: 'Each card shows a homeowner a concept for their own property, with a QR code to request an estimate. You approve the design and the cost first.',
  },
  {
    href: '/google-profile',
    title: 'Google Business Profile setup',
    detail: 'A $99 setup to get the shop’s profile in shape: categories, photos, and the details people search for.',
  },
  {
    href: '/ai-visibility',
    title: 'Free SEO and AI visibility grader',
    detail: 'See what a search engine or an AI assistant can already read about the shop. No ranking promises.',
  },
  {
    href: '/reputation',
    title: 'Review requests',
    detail: 'A link and a QR code so a finished job can turn into an honest public review. The free tool is also on ReputationFlow.',
  },
  {
    href: '/lead-scout',
    title: 'Lead Scout',
    detail: 'Search public Google listings by trade and city. It does not email or text anyone.',
  },
  {
    href: '/missed-call',
    title: 'Missed-call text-back',
    detail: 'A waitlist for texting a caller back after a missed ring, once messaging is approved and the owner opts in.',
  },
];

export default function SuiteHomePage() {
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, '\\u003c') }} />

      <section className={styles.hero} id="start">
        <div>
          <span className={styles.eyebrow}>Front Porch Growth · Hanceville, Alabama</span>
          <h1>Local growth tools for the shop that’s already booked tomorrow.</h1>
          <p className={styles.lede}>
            Postcards, Google profiles, review requests, and a free visibility grader — built for HVAC, plumbing, lawn
            care, and the rest of the trades. The AI receptionist Ava lives on the sister site, Executive Receptionist.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/postcards">
              See YardMailer postcards
            </Link>
            <Link className={styles.secondary} href="/ai-visibility">
              Grade your site free
            </Link>
          </div>
          <p className={styles.fine}>
            Need someone to answer the phone? <Link href="https://executivereceptionist.com/">Meet Ava at Executive Receptionist</Link>.
            Starter there is $79 a month, and Starter is the only plan whose first month is $1.
          </p>
        </div>
      </section>

      <section className={styles.band} id="tools">
        <span className={styles.kicker}>What you can use today</span>
        <h2 className={styles.h2}>Marketing that stays on this site.</h2>
        <ul className={avaStyles.tiles}>
          {TOOLS.map((tool) => (
            <li key={tool.href}>
              <Link className={avaStyles.tile} href={tool.href}>
                <h3>{tool.title}</h3>
                <p>{tool.detail}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.band} id="receptionist">
        <span className={styles.kicker}>Sister product</span>
        <h2 className={styles.h2}>Ava answers the calls this shop would otherwise miss.</h2>
        <p className={styles.body}>
          Executive Receptionist is the AI receptionist brand. Ava tells callers she is AI, takes the job details, and
          emails you the lead. She only answers inbound calls. Plans are month to month, with no free pilot.
        </p>
        <div className={styles.actions}>
          <a className={styles.primary} href="https://executivereceptionist.com/">
            Go to Executive Receptionist
          </a>
          <a className={styles.secondary} href="https://executivereceptionist.com/hvac">
            Ava for HVAC shops
          </a>
        </div>
      </section>

      <section className={styles.band} id="desk">
        <span className={styles.kicker}>Your desk</span>
        <h2 className={styles.h2}>Leads, campaigns, and writing tools in one place.</h2>
        <p className={styles.body}>
          Sign in to your desk to open the Front Porch Growth tools you already use. Buying a postcard campaign or
          grading a site does not always need an account first.
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
        <div className={styles.actions}>
          <Link className={styles.secondary} href="/login?next=/desk">
            Sign in to your desk
          </Link>
        </div>
      </section>

      <section className={styles.wideFaq} id="faq">
        <span className={styles.kicker}>Straight answers</span>
        <h2>Before you pick a tool.</h2>
        {HOME_FAQS.map((faq) => (
          <details key={faq.q}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </section>

      <section className={styles.band}>
        <SisterSites selfUrl="https://frontporchgrowth.com" clusters={['home-services', 'reviews']} />
      </section>

      <section className={styles.closing}>
        <span className={styles.kicker}>Start with what you need</span>
        <h2>Mail a route, fix the profile, or put Ava on the phone.</h2>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/postcards">
            See postcards
          </Link>
          <Link className={styles.secondary} href="/ai-visibility">
            Grade your site free
          </Link>
        </div>
      </section>
    </SuiteShell>
  );
}
