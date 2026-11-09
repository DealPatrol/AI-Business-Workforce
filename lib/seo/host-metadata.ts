import { urlsForHost } from '@/lib/seo/public-urls';
import { requestHost } from '@/lib/seo/request-host';

export async function urlsForRequest(path: string, fallbackCanonical: string, fallbackOpenGraph = fallbackCanonical) {
  return urlsForHost(await requestHost(), path, fallbackCanonical, fallbackOpenGraph);
}
