import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';
import { faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { TRADE_PAGES, getTradePage } from '@/lib/trades/pages';
import { absoluteSiteUrl } from '@/lib/site-url';

export function generateStaticParams() {
  return TRADE_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = getTradePage((await params).slug);
  if (!page) return {};
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: `/trades/${page.slug}` },
    openGraph: { title: page.title, description: page.description, url: `/trades/${page.slug}`, siteName: 'Front Porch Growth', type: 'website' },
  };
}

export default async function TradePage({ params }: { params: Promise<{ slug: string }> }) {
  const page = getTradePage((await params).slug);
  if (!page) notFound();
  const structured = jsonLdGraph([
    {
      '@type': 'Service',
      name: `Front Porch Growth for ${page.name.toLowerCase()}`,
      serviceType: 'Home-service software',
      description: page.description,
      url: absoluteSiteUrl(`/trades/${page.slug}`),
      provider: { '@type': 'Organization', name: 'Front Porch Growth', url: absoluteSiteUrl('/') },
      audience: { '@type': 'BusinessAudience', audienceType: page.name },
    },
    faqNode(page.faqs),
  ]);
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <section className={styles.section}>
        <span className={styles.eyebrow}>{page.name.toUpperCase()}</span>
        <h1>{page.h1}</h1>
        <p>{page.season}</p>
        <h2>Calls that show up</h2>
        <ul>
          {page.calls.map((call) => (
            <li key={call}>{call}</li>
          ))}
        </ul>
        <h2>Executive Receptionist</h2>
        <p>{page.dispatch}</p>
        <p>
          <Link href={`/receptionist/${page.dispatchSlug}`}>Read the {page.name.toLowerCase()} answering guide</Link>
        </p>
        <h2>Reviews</h2>
        <p>{page.reviews}</p>
        <p>
          <Link href="/reputation">ReputationFlow and the free QR tool</Link>
        </p>
        <h2>Finding work</h2>
        <p>{page.leads}</p>
        <p>
          <Link href="/lead-scout">Open Lead Scout</Link>
        </p>
        <h2>Drafts</h2>
        <p>{page.writing}</p>
        <p>
          <Link href="/agents">Open the writing agents</Link>
        </p>
        <section className={styles.faq}>
          {page.faqs.map((faq) => (
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
