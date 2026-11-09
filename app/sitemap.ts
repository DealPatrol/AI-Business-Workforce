import type { MetadataRoute } from 'next';
import { requestHost } from '@/lib/seo/request-host';
import { sitemapForHost } from '@/lib/seo/sitemaps';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapForHost(await requestHost());
}
