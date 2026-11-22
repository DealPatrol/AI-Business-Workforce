import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import {
  HOT_LEADS_SAMPLE_ROWS,
  LEAD_LIST_COLUMNS,
  LEAD_LIST_LINKS,
  LEAD_LIST_SUPPORT_EMAIL,
} from '@/lib/lead-lists/offers';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import styles from '../leads.module.css';
import { CheckoutLink } from './checkout-link';

const seo = pageSeo('/leads/hot');
const title = renderedTitle(seo);
const description = seo.description;
const CHECKOUT = LEAD_LIST_LINKS.hotLeads500;

const FAQS = [
  {
    q: 'What’s in the file?',
    a: 'A CSV that opens in Excel or Google Sheets. Each row has the business name, website, city, state, and a business email where one is available. There are no phone numbers. It is a mixed list of businesses, not a list for one industry or one town.',
  },
  {
    q: 'How fast do I get it?',
    a: `The download is on the next page, right after you pay. Questions? Email ${LEAD_LIST_SUPPORT_EMAIL}.`,
  },
  {
    q: 'What if the download doesn’t work?',
    a: 'If we can’t deliver the file, you get a full refund.',
  },
  {
    q: 'Why are there no phone numbers?',
    a: 'This list is for email and web outreach. We include the business name, website, city, state, and a business email where we can find one. We do not include phone numbers.',
  },
] as const;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/leads/hot' },
  openGraph: {
    images: ['/og-default.png'],
    title,
    description,
    url: '/leads/hot',
    siteName: 'Front Porch Growth',
    type: 'website',
  },
};

function BuyButton({ className, label }: { className?: string; label?: string }) {
  const text = label ?? 'Get 500 Hot Leads for $20';
  return (
    <Suspense
      fallback={
        <a className={className ?? styles.cta} href={CHECKOUT}>
          {text}
        </a>
      }
    >
      <CheckoutLink className={className ?? styles.cta} href={CHECKOUT}>
        {text}
      </CheckoutLink>
    </Suspense>
  );
}

export default function HotLeadsPage() {
  const structured = jsonLdGraph([
    {
      '@type': 'Product',
      name: 'Hot Leads: 500 Business Leads',
      description,
      brand: { '@type': 'Brand', name: 'Front Porch Growth' },
      offers: {
        '@type': 'Offer',
        price: '20.00',
        priceCurrency: 'USD',
        url: CHECKOUT,
        availability: 'https://schema.org/InStock',
      },
    },
    faqNode([...FAQS]),
  ]);

  return (
    <SuiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }}
      />

      <section className={`${styles.hero} ${styles.hotHero}`}>
        <span className={styles.eyebrow}>HOT LEADS</span>
        <h1>Hot Leads: 500 business leads for $20</h1>
        <p className={styles.lede}>
          A mixed list of 500 businesses, delivered as an instant CSV download right after checkout. Each row has the
          business name, website, city, state, and a business email where one is available. No phone numbers. If we
          can’t deliver the file, you get a full refund.
        </p>
        <p className={styles.forWho}>
          Built for web designers, SEO and marketing freelancers, agencies, and B2B sales reps doing cold email
          outreach.
        </p>
        <div className={styles.ctaRow}>
          <BuyButton />
        </div>
        <p className={styles.fine}>
          One-time payment. No subscription. Mixed industries, mostly Alabama and Tennessee businesses (11 states total) — not a list for one niche or one town.
        </p>
      </section>

      <section className={styles.block}>
        <h2>What’s in every row</h2>
        <span className={styles.sampleTagReal}>Free sample: 10 real rows from the list</span>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {LEAD_LIST_COLUMNS.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOT_LEADS_SAMPLE_ROWS.map((row) => (
                <tr key={row.business_name}>
                  <td>{row.business_name}</td>
                  <td>{row.website}</td>
                  <td>{row.email}</td>
                  <td>{row.city}</td>
                  <td>{row.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.fine}>
          These are 10 real rows from the 500-lead file. Emails are partly hidden. Your download includes the full
          addresses, plus 490 more businesses in this format.
        </p>
        <div className={styles.ctaRow}>
          <BuyButton />
        </div>
      </section>

      <section className={styles.block}>
        <h2>How it works</h2>
        <ol className={styles.steps}>
          <li>
            <span className={styles.stepNum} aria-hidden="true">
              1
            </span>
            <p>Pay $20 once at checkout.</p>
          </li>
          <li>
            <span className={styles.stepNum} aria-hidden="true">
              2
            </span>
            <p>On the next page, download your 500-lead CSV instantly.</p>
          </li>
          <li>
            <span className={styles.stepNum} aria-hidden="true">
              3
            </span>
            <p>Open it in Excel or Google Sheets and start outreach. If we can’t deliver the file, you get a full refund.</p>
          </li>
        </ol>
        <div className={styles.ctaRow}>
          <BuyButton />
        </div>
      </section>

      <section className={styles.block}>
        <div className={styles.guarantee}>
          <h2>If we can’t deliver, you get a refund</h2>
          <p>If the download isn’t available after you pay, we refund you in full.</p>
        </div>
      </section>

      <section className={`${styles.block} ${styles.faq}`}>
        <h2>Questions</h2>
        {FAQS.map((faq) => (
          <details key={faq.q}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </section>

      <section className={styles.block}>
        <h2>Get 500 Hot Leads for $20</h2>
        <p>Pay once, then download the CSV on the next page.</p>
        <div className={styles.ctaRow}>
          <BuyButton />
        </div>
        <p className={styles.compliance}>
          If you email these businesses, follow CAN-SPAM: use an honest subject line, include your mailing address, and
          give an easy way to opt out.
        </p>
        <p className={styles.fine}>Questions? Email {LEAD_LIST_SUPPORT_EMAIL}.</p>
      </section>
    </SuiteShell>
  );
}
