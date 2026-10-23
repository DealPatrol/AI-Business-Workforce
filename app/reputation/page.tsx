import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';
import { faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';

const seo = pageSeo('/reputation');
const title = renderedTitle(seo);
const description = seo.description;

const FAQS = [
  {
    q: 'Does ReputationFlow hide bad reviews?',
    a: 'No. Every customer sees the same Google, Facebook, and Yelp links regardless of the rating they select. Private feedback is optional and sits next to those public links.',
  },
  {
    q: 'What does it cost?',
    a: 'ReputationFlow’s pricing page says you can start free with one review link, or use Professional for $20 a month. There is no setup fee. Professional can be canceled in the Stripe customer portal. There is no trial stacked on top of the free starter.',
  },
  {
    q: 'Will this produce more 5-star reviews by itself?',
    a: 'The tool asks for a review and can draft a reply. A 5-star review still depends on the job. This page does not quote a customer count or a ranking guarantee.',
  },
] as const;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/reputation' },
  openGraph: { title, description, url: '/reputation', siteName: 'Front Porch Growth', type: 'website' },
};

export default function ReputationPage() {
  const structured = jsonLdGraph([
    {
      '@type': 'SoftwareApplication',
      name: 'ReputationFlow',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://tryreputationflow.com',
      description,
      offers: {
        '@type': 'Offer',
        price: '20.00',
        priceCurrency: 'USD',
        description: 'Professional plan, $20 per month, as published on ReputationFlow’s pricing page.',
        url: 'https://tryreputationflow.com/pricing',
      },
    },
    faqNode([...FAQS]),
  ]);
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <section className={styles.section}>
        <span className={styles.eyebrow}>REVIEWS</span>
        <h1>Ask for the review. Draft the reply. Leave the public links alone.</h1>
        <p>
          ReputationFlow is the review product Cole already runs at tryreputationflow.com. Automated requests plus a draft reply are how a shop follows up after a job. More 5-star Google reviews are the point when the work deserved them. The product does not filter who is invited to post in public.
        </p>
        <div className={styles.grid}>
          <article className={styles.card}>
            <h2>Free Google review QR</h2>
            <p>Make a QR code or a Google review link without an account. The tools live on ReputationFlow.</p>
            <p>
              <a href="https://tryreputationflow.com/tools/qr-code">QR code tool</a>
            </p>
            <p>
              <a href="https://tryreputationflow.com/tools/google-review-link">Google review link</a>
            </p>
          </article>
          <article className={styles.card}>
            <h2>Requests and reply drafts</h2>
            <p>Professional is $20 a month for email requests, history, and reply drafts. The free starter is one review link.</p>
            <p className={styles.price}>$0 or $20/month</p>
            <a className={styles.button} href="https://tryreputationflow.com/pricing">
              See ReputationFlow pricing
            </a>
          </article>
        </div>
        <p>
          A reply writer also lives on this site if you want a draft before you open ReputationFlow.{' '}
          <Link href="/agents/review-reply">Write a review reply</Link>.
        </p>
        <section className={styles.faq}>
          {FAQS.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </section>
      </section>
    </SuiteShell>
  );
}
