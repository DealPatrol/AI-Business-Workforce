import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AgentForm } from '@/components/agents/AgentForm';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';
import { AGENTS, getAgent } from '@/lib/agents/catalog';
import { agentDocumentTitle } from '@/lib/seo/pages';

export function generateStaticParams() {
  return AGENTS.map((agent) => ({ slug: agent.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const agent = getAgent((await params).slug);
  if (!agent) return {};
  const title = agentDocumentTitle(agent.title);
  return {
    title: { absolute: title },
    description: agent.blurb,
    alternates: { canonical: `/agents/${agent.id}` },
    openGraph: { title, description: agent.blurb, url: `/agents/${agent.id}`, siteName: 'Front Porch Growth', type: 'website' },
  };
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const agent = getAgent((await params).slug);
  if (!agent) notFound();
  return (
    <SuiteShell>
      <section className={styles.section}>
        <span className={styles.eyebrow}>WRITING AGENT</span>
        <h1>{agent.title}</h1>
        <p>{agent.blurb}</p>
        <p>
          <Link href="/agents">All agents</Link>
        </p>
        <AgentForm agent={agent} />
      </section>
    </SuiteShell>
  );
}
