import { absoluteUrl, EXECUTIVE_RECEPTIONIST_ORIGIN, isExecutiveReceptionistHost } from '@/lib/site-url';

/**
 * Canonical and Open Graph URL for one path.
 * On an Executive Receptionist host both are absolute on that apex.
 * On every other host the existing relative or absolute values are left as they are.
 */
export function urlsForHost(
  hostHeader: string | null | undefined,
  path: string,
  fallbackCanonical: string,
  fallbackOpenGraph = fallbackCanonical,
) {
  if (!isExecutiveReceptionistHost(hostHeader)) {
    return { canonical: fallbackCanonical, openGraphUrl: fallbackOpenGraph };
  }
  const url = absoluteUrl(EXECUTIVE_RECEPTIONIST_ORIGIN, path);
  return { canonical: url, openGraphUrl: url };
}
