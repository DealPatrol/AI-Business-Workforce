import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { AvaGuidePage } from '@/components/ava/AvaGuidePage';
import { avaGuideSlugs, getAvaGuide } from '@/lib/ava/trade-pages';
import { avaAbsoluteUrl, avaHomeHrefForHost } from '@/lib/site';

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
  const url = avaAbsoluteUrl(`/ava/${slug}`);
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
  const requestHeaders = await headers();
  const homeHref = avaHomeHrefForHost(
    requestHeaders.get('x-forwarded-host') || requestHeaders.get('host'),
  );
  return <AvaGuidePage guide={page} homeHref={homeHref} />;
}
