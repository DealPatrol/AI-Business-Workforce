import type { Metadata } from 'next';
import { urlsForRequest } from '@/lib/seo/host-metadata';
import { metadataTitle, renderedTitle, type SeoSpec } from '@/lib/seo/pages';

/** Metadata for the all-business Ava pages. Canonical follows the request host like /hvac. */
export async function businessPageMetadata(path: string, seo: SeoSpec): Promise<Metadata> {
  const title = renderedTitle(seo);
  const { canonical, openGraphUrl } = await urlsForRequest(path, path);
  return {
    title: metadataTitle(seo),
    description: seo.description,
    alternates: { canonical },
    openGraph: {
      images: ['/og-home.png'],
      title,
      description: seo.description,
      url: openGraphUrl,
      siteName: 'Executive Receptionist',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description: seo.description, images: ['/og-home.png'] },
  };
}
