import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PersonalizedDemo from '@/components/PersonalizedAvaDemo';
import { getProspectBySlug, PROSPECTS } from '@/lib/prospects';
import './demo.css';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return PROSPECTS.filter((p) => p.personalizedDemo).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const prospect = getProspectBySlug(slug);
  if (!prospect) return { title: 'Demo not found' };
  return {
    title: `${prospect.companyName} — Ava AI Receptionist Demo`,
    description: `See how Ava handles missed calls for ${prospect.companyName}. Built for ${prospect.ownerName}.`,
  };
}

export default async function ProspectDemoPage({ params }: PageProps) {
  const { slug } = await params;
  const prospect = getProspectBySlug(slug);
  if (!prospect?.personalizedDemo) notFound();
  return <PersonalizedDemo prospect={prospect} />;
}
