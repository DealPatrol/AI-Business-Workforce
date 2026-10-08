import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getAppUrl, getAvaSiteUrl, isAvaMarketingHost } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
  const origin = isAvaMarketingHost(host) ? getAvaSiteUrl() : getAppUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/onboarding/', '/dashboard/', '/login'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
