import type { MetadataRoute } from 'next';
import { avaGuideSlugs } from '@/lib/ava/trade-pages';
import { absoluteSiteUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteSiteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteSiteUrl('/ava'), lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: absoluteSiteUrl('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteSiteUrl('/receptionist-demo'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ...avaGuideSlugs().map((slug) => ({
      url: absoluteSiteUrl(`/ava/${slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.88,
    })),
  ];
}
