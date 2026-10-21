import type { Metadata } from 'next';
import { LeadScoutApp } from '@/components/lead-scout/LeadScoutApp';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';
import { faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';

const seo = pageSeo('/lead-scout');
const title = renderedTitle(seo);
const description = seo.description;

const FAQS = [
  {
    q: 'Does Lead Scout contact the businesses?',
    a: 'No. It reads public Google Places results and shows them. There is no send button.',
  },
  {
    q: 'What if Google Maps is not configured?',
    a: 'The search stops and says the server key is missing. No request is sent to Google.',
  },
  {
    q: 'How is this different from Lead Finder?',
    a: 'Lead Finder is the signed-in workspace for buyer lists and approved drafts. Lead Scout is the public search. Neither one sends mail unless Lead Finder’s separate cold-email switch is on, and that switch is off by default.',
  },
] as const;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/lead-scout' },
  openGraph: { title, description, url: '/lead-scout', siteName: 'Front Porch Growth', type: 'website' },
};

export default function LeadScoutPage() {
  const structured = jsonLdGraph([
    {
      '@type': 'SoftwareApplication',
      name: 'Lead Scout',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description,
    },
    faqNode([...FAQS]),
  ]);
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <section className={styles.section}>
        <span className={styles.eyebrow}>LEAD SCOUT</span>
        <h1>Find businesses in a city. Do not contact them from here.</h1>
        <p>
          There is no DealPatrol repository named Lead Scout. This page is a small search on the Google Places key this site already uses for Lead Finder. One trade, one city, up to ten listings.
        </p>
        <LeadScoutApp />
        <section className={styles.faq}>
          <h2>Before you search</h2>
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
