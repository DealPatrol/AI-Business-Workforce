import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PersonalizedDemo from '@/components/PersonalizedAvaDemo';
import { gateProspectPage } from '@/lib/prospect-gate';
import { getProspectBySlug, PROSPECTS } from '@/lib/prospects';
import './demo.css';
import './voice-picker.css';

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

const PRIVATE_META: Metadata = {
  title: 'Private demo',
  robots: { index: false, follow: false },
};

function nextPathFor(slug: string) {
  return /^[a-z0-9-]+$/.test(slug) ? `/demo/${slug}` : '/dashboard';
}

export async function generateStaticParams() {
  return PROSPECTS.filter((p) => p.personalizedDemo).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const access = await gateProspectPage(nextPathFor(slug));
  if (access !== 'allow') return PRIVATE_META;
  const prospect = getProspectBySlug(slug);
  if (!prospect) return { title: 'Demo not found', robots: { index: false, follow: false } };
  return {
    title: `${prospect.companyName} — Executive Receptionist Demo`,
    robots: { index: false, follow: false },
    description: `See how Executive Receptionist handles missed calls for ${prospect.companyName}. Built for ${prospect.ownerName}.`,
  };
}

export default async function ProspectDemoPage({ params }: PageProps) {
  const { slug } = await params;
  const access = await gateProspectPage(nextPathFor(slug));
  if (access !== 'allow') return null;
  const prospect = getProspectBySlug(slug);
  if (!prospect?.personalizedDemo) notFound();
  return <PersonalizedDemo prospect={prospect} />;
}
