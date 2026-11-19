import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AgentForm } from '@/components/agents/AgentForm';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';
import { AGENTS, getAgent } from '@/lib/agents/catalog';
import { agentSeo } from '@/lib/agents/seo-content';
import { faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { absoluteSiteUrl } from '@/lib/site-url';

export function generateStaticParams() {
  return AGENTS.map((agent) => ({ slug: agent.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const agent = getAgent((await params).slug);
  if (!agent) return {};
  const seo = agentSeo(agent.id);
  const title = seo.metaTitle;
  const description = seo.metaDescription;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/agents/${agent.id}` },
    openGraph: { images: ['/og-default.png'], title, description, url: `/agents/${agent.id}`, siteName: 'Front Porch Growth', type: 'website' },
  };
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const agent = getAgent((await params).slug);
  if (!agent) notFound();
  const seo = agentSeo(agent.id);
  const url = absoluteSiteUrl(`/agents/${agent.id}`);
  const structured = jsonLdGraph([
    {
      '@type': 'SoftwareApplication',
      name: agent.title,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: seo.metaDescription,
      url,
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      provider: { '@type': 'Organization', name: 'Front Porch Growth', url: absoluteSiteUrl('/') },
    },
    faqNode(seo.faqs),
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteSiteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Writing agents', item: absoluteSiteUrl('/agents') },
        { '@type': 'ListItem', position: 3, name: agent.title, item: url },
      ],
    },
  ]);
  const others = AGENTS.filter((other) => other.id !== agent.id);
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <section className={styles.section}>
        <span className={styles.eyebrow}>FREE WRITING AGENT</span>
        <h1>{agent.title}</h1>
        <p>{seo.intro}</p>
        <p>Free to use, no account needed. Nothing is sent or posted for you.</p>
        <p>
          <Link href="/agents">All agents</Link>
        </p>
        <AgentForm agent={agent} />

        <h2>How to use the {agent.title.toLowerCase()}</h2>
        <ol>
          {seo.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <h2>Example</h2>
        <p>What an owner typed:</p>
        <ul>
          {seo.exampleInput.map((row) => (
            <li key={row.label}>
              <strong>{row.label}:</strong> {row.value}
            </li>
          ))}
        </ul>
        <p>A draft like the one it returns:</p>
        <blockquote style={{ whiteSpace: 'pre-line', borderLeft: '3px solid currentColor', margin: '0 0 1em', paddingLeft: 14 }}>
          {seo.exampleDraft}
        </blockquote>
        <p>Every draft is different. Read it and edit it before you send or post it.</p>

        <h2>Tips</h2>
        <ul>
          {seo.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>

        <h2>Questions</h2>
        <section className={styles.faq}>
          {seo.faqs.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </section>

        <h2>Other free writing agents</h2>
        <ul>
          {others.map((other) => (
            <li key={other.id}>
              <Link href={`/agents/${other.id}`}>{other.title}</Link>
            </li>
          ))}
        </ul>
      </section>
    </SuiteShell>
  );
}
