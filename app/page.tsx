import type { Metadata } from 'next';
import Link from 'next/link';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { InvoicingWaitlistForm } from '@/components/suite/InvoicingWaitlistForm';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';
import { faqNode } from '@/lib/ava/structured-data';
import { POSTCARD_FULFILLMENT_COPY, POSTCARD_PRICE_SUMMARY, postcardPublicOffers } from '@/lib/postcards/pricing';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { absoluteSiteUrl } from '@/lib/site-url';

const seo = pageSeo('/');
const title = renderedTitle(seo);
const description = seo.description;

const HOME_FAQS = [
  {
    q: 'What can I buy on this site today?',
    a: 'Two products have a checkout. YardMailer postcards are a $127 one-time setup, charged once per customer, plus $3.54 per 4×6 card or $4.95 per 6×9 card. Postage, printing, and mailing are included. Executive Receptionist is a separate AI receptionist: Starter $77, Growth $168, and Pro $324 a month after a free 7-day trial, with a $0 setup fee. ReputationFlow is a separate site with a free starter and Professional at $20/month. Lead Scout and the writing agents have no separate public price. Lead Finder is a signed-in workspace. Invoicing is a waitlist and is not for sale.',
  },
  {
    q: 'How is Executive Receptionist different from the postcard campaign?',
    a: `Postcards are mail. ${POSTCARD_FULFILLMENT_COPY} Each card has a QR page where a homeowner can request an estimate. Executive Receptionist answers phone calls, asks for the caller’s name, number, and what they need, and texts you that lead. They are separate products. You can buy one without the other.`,
  },
  {
    q: 'How do I start?',
    a: 'For postcards, choose a size and quantity on the postcards page. The charge is a one-time $127 setup plus the cards, or email Cole at colecollins763@gmail.com. For Executive Receptionist, choose a plan and Stripe starts the 7-day trial. After checkout you finish a setup form. A person attaches the phone number. The browser demo is not your business line.',
  },
  {
    q: 'Does the invoicing form email me?',
    a: 'No. The form saves the email, and any name or business you add, on a private list. Joining does not start a subscription and does not send you email.',
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
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${absoluteSiteUrl('/')}#org`,
      name: 'Front Porch Growth',
      url: absoluteSiteUrl('/'),
      logo: absoluteSiteUrl('/brand-logo.png'),
      description: 'Tools that bring home-service businesses more jobs.',
      email: 'hello@frontporchgrowth.com',
      makesOffer: [
        ...postcardPublicOffers(absoluteSiteUrl('/postcards')),
        {
          '@type': 'Offer',
          name: 'Executive Receptionist, plans from $77/month after a 7-day trial',
          url: absoluteSiteUrl('/receptionist'),
        },
      ],
    },
    { '@type': 'WebSite', name: 'Front Porch Growth', url: absoluteSiteUrl('/'), publisher: { '@id': `${absoluteSiteUrl('/')}#org` } },
    faqNode([...HOME_FAQS]),
  ],
};

export default function SuiteHomePage() {
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, '\\u003c') }} />
      <section className={styles.hero} id="start">
        <div>
          <span className={styles.eyebrow}>HOME-SERVICE TOOLS</span>
          <h1>Tools that bring home-service businesses more jobs.</h1>
          <p className={styles.lede}>
            Postcards that show the job, an AI receptionist that answers the call, a lead finder you approve before anything sends, and invoicing when it is ready.
          </p>
          <div className={styles.heroActions}>
            <TrackedCheckoutLink className={styles.button} href="/api/checkout?plan=starter" plan="starter">
              Start Executive Receptionist’s free trial
            </TrackedCheckoutLink>
            <Link className={styles.buttonSecondary} href="/postcards#packages">
              See postcard packages
            </Link>
          </div>
          <p className={styles.fine}>
            Executive Receptionist is a 7-day trial, then $77, $168, or $324 a month. {POSTCARD_PRICE_SUMMARY}
          </p>
          <div className={styles.priceRow}>
            <Link href="/receptionist">Executive Receptionist from $77/month</Link>
            <Link href="/postcards#packages">Postcards from $127 setup + per card</Link>
            <Link href="/pricing">All prices</Link>
            <Link href="/compare">Compare published prices</Link>
          </div>
        </div>
        <aside className={styles.chooser} aria-label="Which tool to start with">
          <h2>Two products you can start today.</h2>
          <div className={styles.choice}>
            <span className={styles.kicker}>CALLS</span>
            <h3>Executive Receptionist answers the phone.</h3>
            <p>Missed and after-hours calls. She takes the name, number, and job, then texts you.</p>
            <Link className={styles.textLink} href="/receptionist">
              See how Executive Receptionist works
            </Link>
          </div>
          <div className={styles.choice}>
            <span className={styles.kicker}>MAIL</span>
            <h3>YardMailer sends the postcard.</h3>
            <p>{POSTCARD_FULFILLMENT_COPY} Each card has a QR page where the homeowner can request an estimate.</p>
            <Link className={styles.textLink} href="/postcards">
              See postcard campaigns
            </Link>
          </div>
          <p className={styles.quiet}>
            Lead Finder stays inside the signed-in workspace. Invoicing is a waitlist, not a product you can buy yet.
          </p>
        </aside>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <span className={styles.kicker}>POSTCARDS</span>
          <h2>
            <Link href="/postcards">YardMailer</Link>
          </h2>
          <p>{POSTCARD_FULFILLMENT_COPY} Postage, printing, and mailing are included. The setup fee is charged once per customer.</p>
          <p className={styles.price}>$127 setup + $3.54 or $4.95 per card</p>
          <p className={styles.quiet}>100, 250, or 500 cards, or a custom quantity of at least 100.</p>
          <div className={styles.cardActions}>
            <Link className={styles.button} href="/postcards#packages">
              See postcard packages
            </Link>
            <Link className={styles.textLink} href="/postcards">
              See the campaign
            </Link>
          </div>
        </article>

        <article className={styles.card}>
          <span className={styles.kicker}>AI RECEPTIONIST</span>
          <h2>
            <Link href="/receptionist">Executive Receptionist</Link>
          </h2>
          <p>Executive Receptionist answers missed and after-hours calls, qualifies the lead, and texts you. Starter, Growth, and Pro stay on their own prices.</p>
          <p className={styles.price}>$77 / $168 / $324 a month</p>
          <p className={styles.quiet}>Free 7-day trial. $0 setup.</p>
          <div className={styles.cardActions}>
            <TrackedCheckoutLink className={styles.button} href="/api/checkout?plan=starter" plan="starter">
              Start free 7-day trial
            </TrackedCheckoutLink>
            <Link className={styles.textLink} href="/receptionist">
              See Executive Receptionist
            </Link>
          </div>
        </article>

        <article className={styles.card}>
          <span className={styles.kicker}>REVIEWS</span>
          <h2>
            <Link href="/reputation">ReputationFlow</Link>
          </h2>
          <p>Request a review and draft the reply. The free Google review QR lives on ReputationFlow. The public review links stay the same no matter the rating.</p>
          <p className={styles.price}>Free, or $20/month</p>
          <p className={styles.quiet}>Professional price is published on tryreputationflow.com.</p>
          <div className={styles.cardActions}>
            <a className={styles.button} href="https://tryreputationflow.com/tools/qr-code">
              Free review QR
            </a>
            <Link className={styles.textLink} href="/reputation">
              How reviews work
            </Link>
          </div>
        </article>

        <article className={styles.card}>
          <span className={styles.kicker}>LEAD SCOUT</span>
          <h2>
            <Link href="/lead-scout">Lead Scout</Link>
          </h2>
          <p>Search public listings by trade and city. The page shows the results. It does not email or text them.</p>
          <p className={styles.price}>No separate price</p>
          <div className={styles.cardActions}>
            <Link className={styles.button} href="/lead-scout">
              Search a city
            </Link>
          </div>
        </article>

        <article className={styles.card}>
          <span className={styles.kicker}>WRITING AGENTS</span>
          <h2>
            <Link href="/agents">Six drafts</Link>
          </h2>
          <p>Estimate, review reply, job ad, follow-up text, service-area page, and invoice reminder. You copy the draft. Nothing is sent.</p>
          <p className={styles.price}>Included on the site</p>
          <div className={styles.cardActions}>
            <Link className={styles.button} href="/agents">
              Open the agents
            </Link>
          </div>
        </article>

        <article className={styles.card}>
          <span className={styles.kicker}>LEAD FINDER</span>
          <h2>
            <Link href="/dashboard/prospector">Lead Finder</Link>
          </h2>
          <p>Turn a website into buyer types, search Google Maps, and draft outreach. Every send stays approved, capped, and off until cold email is explicitly enabled.</p>
          <p className={styles.price}>Operator workspace</p>
          <p className={styles.quiet}>Sign in with the same account as the campaign inbox.</p>
          <div className={styles.cardActions}>
            <Link className={styles.button} href="/dashboard/prospector">
              Sign in to Lead Finder
            </Link>
          </div>
        </article>

        <article className={styles.card} id="invoicing">
          <span className={styles.soon}>COMING SOON</span>
          <h2>Invoicing</h2>
          <p>Estimates and invoices for the jobs the other tools bring in. Join the list and we save it. This form does not send email.</p>
          <InvoicingWaitlistForm />
        </article>
      </section>

      <section className={styles.section} id="tour">
        <span className={styles.eyebrow}>PRODUCT TOUR</span>
        <h2>A short look at the suite.</h2>
        <p>The video is the pages on this site, with captions. It is not a customer testimonial.</p>
        <video
          controls
          playsInline
          preload="metadata"
          style={{ width: '100%', borderRadius: 16, background: '#10281c' }}
          aria-label="Front Porch Growth product tour"
        >
          <source src="/suite-tour.mp4" type="video/mp4" />
        </video>
        <p className={styles.quiet}>
          Trades: <Link href="/trades/plumbers">plumbers</Link>, <Link href="/trades/hvac">HVAC</Link>,{' '}
          <Link href="/trades/roofers">roofers</Link>, <Link href="/trades/lawn-care">lawn care</Link>,{' '}
          <Link href="/trades/cleaners">cleaners</Link>. After-hours ad page:{' '}
          <Link href="/receptionist/missed-calls">missed calls</Link>.
        </p>
      </section>

      <section className={styles.faq} id="faq">
        <span className={styles.eyebrow}>BEFORE YOU PAY</span>
        <h2>Which tool, and what it costs.</h2>
        {HOME_FAQS.map((faq) => (
          <details key={faq.q}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </section>
    </SuiteShell>
  );
}
