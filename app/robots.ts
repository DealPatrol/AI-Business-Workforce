import type { MetadataRoute } from 'next';
import { requestHost } from '@/lib/seo/request-host';
import { robotsForHost } from '@/lib/seo/sitemaps';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  return robotsForHost(await requestHost());
}
