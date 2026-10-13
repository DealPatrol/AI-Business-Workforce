import type { MetadataRoute } from 'next';
import { absoluteSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/prospector/unsubscribe'],
        disallow: ['/api/', '/onboarding/', '/dashboard/', '/login', '/sales', '/demo', '/audit'],
      },
    ],
    sitemap: absoluteSiteUrl('/sitemap.xml'),
  };
}
