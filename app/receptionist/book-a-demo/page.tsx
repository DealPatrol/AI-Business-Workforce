import type { Metadata } from 'next';
import Link from 'next/link';
import { DemoQualifier } from '@/components/er/DemoQualifier';
import { EditorialShell } from '@/components/er/EditorialShell';
import styles from '@/components/er/editorial.module.css';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { avaOrganization, faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { executiveReceptionistUrl } from '@/lib/site-url';

const PATH = '/receptionist/book-a-demo';
const seo = pageSeo(PATH);
const title = renderedTitle(seo);
const url = executiveReceptionistUrl(PATH);

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  alternates: { canonical: url },
  openGraph: { images: ['/og-default.png'], title, description: seo.description, url, siteName: 'Executive Receptionist', type: 'website' },
};

const FAQS = [
  {
    q: 'How long is the demo?',
    a: 'About 15 minutes by phone or video. You hear Ava answer as a shop in your trade, see what the lead email looks like, and go over your Google profile.',
  },
  {
    q: 'Do I need a card to book?',
    a: 'No. Booking a demo is free. If you want to start right away, Starter is $1 the first month, then $79 a month.',
  },
  {
    q: 'What does the package finder do with my numbers?',
    a: 'It runs simple arithmetic in your browser to suggest a plan by minutes. Nothing is sent until you press Request my demo.',
  },
];

const structured = jsonLdGraph([
  {
    '@type': 'WebPage',
    name: title,
    url,
    description: seo.description,
    publisher: avaOrganization(),
    potentialAction: { '@type': 'ReserveAction', name: 'Book an Executive Receptionist demo', target: url },
  },
  faqNode(FAQS),
]);

type PageProps = { searchParams: Promise<{ package?: string | string[] }> };

export default async function BookDemoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.package) ? params.package[0] : params.package;
  const initialPackage = raw ? raw.slice(0, 60) : undefined;
  const bookingUrl = process.env.NEXT_PUBLIC_AVA_SETUP_BOOKING_URL || undefined;
  return (
    <EditorialShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <main>
        <section className={styles.hero}>
          <div className={styles.wrap}>
            <p className={styles.kicker}>Book a demo · 15 minutes</p>
            <h1>
              Find your package, then <em>hear Ava</em> answer for your trade.
            </h1>
            <p className={styles.answer}>
              Put in your own call numbers and the finder suggests an Ava plan by minutes, plus a Google profile bundle if your
              listing needs work. Then request a 15-minute demo with Cole Collins (Central time). Can’t wait? Call{' '}
              <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a> now; she answers as {AVA_DEMO_LINE.answersAs}.
            </p>
          </div>
        </section>
        <section className={styles.section}>
          <div className={styles.wrap}>
            <ol className={styles.steps}>
              <li>Answer six quick questions about your calls and your Google profile.</li>
              <li>See the plan or bundle that fits, priced from the public price list.</li>
              <li>Request a demo time. Cole confirms by email or phone.</li>
            </ol>
            <DemoQualifier initialPackage={initialPackage} bookingUrl={bookingUrl} />
            <p className={styles.note} style={{ marginTop: 16 }}>
              Every price is on the <Link href="/receptionist/packages">packages page</Link> and the{' '}
              <Link href="/pricing">pricing page</Link>.
            </p>
          </div>
        </section>
        <section className={`${styles.section} ${styles.faq}`}>
          <div className={styles.wrap}>
            <h2>Before you book</h2>
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </EditorialShell>
  );
}
