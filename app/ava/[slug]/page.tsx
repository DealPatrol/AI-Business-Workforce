import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AvaGuidePage } from '@/components/ava/AvaGuidePage';
import { avaGuideSlugs, getAvaGuide } from '@/lib/ava/trade-pages';
import { absoluteSiteUrl } from '@/lib/site-url';

export function generateStaticParams() {
  return avaGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getAvaGuide(slug);
  if (!page) return {};
  const url = absoluteSiteUrl(`/ava/${slug}`);
  return {
    title: { absolute: page.metaTitle },
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      title: page.metaTitle,
      description: page.description,
      url,
      siteName: 'Ava',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.description,
    },
  };
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getAvaGuide(slug);
  if (!page) notFound();
  return <AvaGuidePage guide={page} homeHref="/ava" />;
}
