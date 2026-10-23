import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';
import { AGENTS } from '@/lib/agents/catalog';
import { faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';

const seo = pageSeo('/agents');
const title = renderedTitle(seo);
const description = seo.description;

const FAQS = [
  {
    q: 'Do these agents send messages?',
    a: 'No. Each one returns a draft you can copy. They do not email, text, or mail anyone.',
  },
  {
    q: 'What if the AI key is missing?',
    a: 'The page shows that OpenAI is not configured and that no draft was requested. It does not invent a finished draft.',
  },
] as const;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/agents' },
  openGraph: { title, description, url: '/agents', siteName: 'Front Porch Growth', type: 'website' },
};

export default function AgentsPage() {
  const structured = jsonLdGraph([
    {
      '@type': 'SoftwareApplication',
      name: 'Front Porch Growth writing agents',
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
        <span className={styles.eyebrow}>WRITING AGENTS</span>
        <h1>Drafts for the work between the call and the invoice.</h1>
        <p>
          Six agents use the same OpenAI key already used for audits and Lead Finder. They are rate-limited. If the key is missing, you get that error instead of a fake draft.
        </p>
        <div className={styles.grid}>
          {AGENTS.map((agent) => (
            <article className={styles.card} key={agent.id}>
              <h2>
                <Link href={`/agents/${agent.id}`}>{agent.title}</Link>
              </h2>
              <p>{agent.blurb}</p>
              <Link className={styles.textLink} href={`/agents/${agent.id}`}>
                Open the {agent.title.toLowerCase()}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </SuiteShell>
  );
}
