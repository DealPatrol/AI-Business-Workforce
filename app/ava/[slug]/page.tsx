import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AvaGuidePage } from '@/components/ava/AvaGuidePage';
import { getAvaGuide } from '@/lib/ava/trade-pages';
import { indexedAvaGuideSlugs } from '@/lib/seo/sitemaps';
import { urlsForRequest } from '@/lib/seo/host-metadata';
import { executiveReceptionistUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return indexedAvaGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getAvaGuide(slug);
  if (!page) return {};
  const published = executiveReceptionistUrl(`/ava/${slug}`);
  const { canonical, openGraphUrl } = await urlsForRequest(`/ava/${slug}`, published, published);
  return {
    title: { absolute: page.metaTitle },
    description: page.description,
    alternates: { canonical },
    openGraph: { images: ['/og-default.png'],
      title: page.metaTitle,
      description: page.description,
      url: openGraphUrl,
      siteName: 'Executive Receptionist',
      type: 'website',
    },
    twitter: { images: ['/og-default.png'],
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
