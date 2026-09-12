import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/onboarding/'] }],
    sitemap: 'https://ai-business-workforce.vercel.app/sitemap.xml',
  };
}
