import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';
import { COMPARISON_AS_OF, COMPARISON_FACTS, COMPARISON_SOURCES } from '@/lib/comparison/facts';
import { faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { FpgCompareHub } from '@/components/fpg/CompareHub';
import { requestHost } from '@/lib/seo/request-host';
import { isExecutiveReceptionistHost } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

const FPG_COMPARE_TITLE = 'Compare Front Porch Growth: Postcards, SEO, Reviews';
const FPG_COMPARE_DESCRIPTION =
  'Front Porch Growth next to Local SEO Bot, BrightLocal, PostcardMania, USPS EDDM, AEO Engine, Otterly.ai and NiceJob. Prices from each vendor’s page.';

const seo = pageSeo('/compare');
const title = renderedTitle(seo);
const description = seo.description;

const FAQS = [
  {
    q: 'Is Front Porch Growth a replacement for ServiceTitan, Jobber, or Housecall Pro?',
    a: 'No. Those products publish scheduling, invoicing, and dispatch boards. Executive Receptionist answers calls and emails the lead. YardMailer sends postcards you approve. ReputationFlow requests reviews. None of that is a field-service system.',
  },
  {
    q: 'Where do the competitor prices come from?',
    a: `Each row links to the company’s own page. The check date is ${COMPARISON_AS_OF}. If a page did not show a dollar amount, this page says so instead of guessing.`,
  },
] as const;

const SHARED_METADATA: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/compare' },
  openGraph: { images: ['/og-default.png'], title, description, url: '/compare', siteName: 'Front Porch Growth', type: 'website' },
};

/** frontporchgrowth.com (and previews) get the Front Porch Growth compare hub; executivereceptionist.com keeps the shared page. */
export async function generateMetadata(): Promise<Metadata> {
  if (isExecutiveReceptionistHost(await requestHost())) return SHARED_METADATA;
  return {
    title: { absolute: FPG_COMPARE_TITLE },
    description: FPG_COMPARE_DESCRIPTION,
    alternates: { canonical: '/compare' },
    openGraph: { images: ['/og-default.png'], title: FPG_COMPARE_TITLE, description: FPG_COMPARE_DESCRIPTION, url: '/compare', siteName: 'Front Porch Growth', type: 'website' },
  };
}

export default async function ComparePage() {
  if (!isExecutiveReceptionistHost(await requestHost())) return <FpgCompareHub />;
  return <SharedComparePage />;
}

function SharedComparePage() {
  const structured = jsonLdGraph([faqNode([...FAQS])]);
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <section className={styles.section}>
        <span className={styles.eyebrow}>COMPARISON</span>
        <h1>Published prices, checked {COMPARISON_AS_OF}.</h1>
        <p>
          Front Porch Growth is the lower published price for the jobs on this site: answering, postcards, review requests, a public lead search, and drafts. It is not a claim to be the largest suite, and it does not replace the field software below.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company</th>
                <th>Published price</th>
                <th>Terms they publish</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FACTS.map((fact) => (
                <tr key={fact.name}>
                  <td>
                    <strong>{fact.name}</strong>
                    <div className={styles.quiet}>{fact.category}</div>
                  </td>
                  <td>{fact.publishedPrice}</td>
                  <td>
                    {fact.terms}
                    <div className={styles.quiet}>{fact.whatTheyPublish}</div>
                    <div>
                      <a href={fact.sourceUrl}>{fact.sourceLabel}</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2>Sources</h2>
        <ul>
          {COMPARISON_SOURCES.map((source) => (
            <li key={source.url}>
              <a href={source.url}>{source.label}</a>
            </li>
          ))}
        </ul>
        <p className={styles.quiet}>
          ServiceTitan terms: <a href="https://get.servicetitan.com/rs/304-EAE-038/images/TermsOfUse.pdf">Terms of Use PDF</a>.
          ReputationFlow price: <a href="https://tryreputationflow.com/pricing">tryreputationflow.com/pricing</a>. Our prices:{' '}
          <Link href="/pricing">pricing page</Link>.
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
