import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { avaGuideSlugs } from '@/lib/ava/trade-pages';
import { avaAbsoluteUrl, avaCanonicalHomePath, getAppUrl, getAvaSiteUrl, isAvaMarketingHost } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
  const marketing = isAvaMarketingHost(host);
  const now = new Date();
  const appBase = getAppUrl();
  const avaBase = getAvaSiteUrl();

  const guideEntries: MetadataRoute.Sitemap = avaGuideSlugs().map((slug) => ({
    url: avaAbsoluteUrl(`/ava/${slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: slug === 'missed-call-cost-calculator' || slug === 'ai-receptionist-vs-answering-service' ? 0.9 : 0.8,
  }));

  const avaEntries: MetadataRoute.Sitemap = [
    {
      url: avaAbsoluteUrl(avaCanonicalHomePath()),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: marketing ? 1 : 0.95,
    },
    ...guideEntries,
    {
      url: avaAbsoluteUrl('/receptionist-demo'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  if (marketing) {
    return [
      ...avaEntries,
      {
        url: `${avaBase}/privacy`,
        lastModified: now,
        changeFrequency: 'yearly',
        priority: 0.2,
      },
    ];
  }

  return [
    { url: `${appBase}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...avaEntries,
    { url: `${appBase}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
