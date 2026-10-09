import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/prospector/unsubscribe'],
        disallow: ['/api/', '/onboarding/', '/dashboard/', '/login'],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
