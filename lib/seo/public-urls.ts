import { receptionistHomePath } from '@/lib/seo/receptionist-home';
import { absoluteUrl, EXECUTIVE_RECEPTIONIST_ORIGIN, isExecutiveReceptionistHost } from '@/lib/site-url';

/**
 * Canonical and Open Graph URL for one path.
 * Receptionist pages (/ava, /hvac, /start, the industry pages and the /ava guides) always
 * canonicalize to executivereceptionist.com, their one home, on every host.
 * On an Executive Receptionist host every other path is absolute on that apex too.
 * On every other host the existing relative or absolute values are left as they are.
 */
export function urlsForHost(
  hostHeader: string | null | undefined,
  path: string,
  fallbackCanonical: string,
  fallbackOpenGraph = fallbackCanonical,
) {
  const receptionistPath = receptionistHomePath(path);
  if (receptionistPath) {
    const url = absoluteUrl(EXECUTIVE_RECEPTIONIST_ORIGIN, receptionistPath);
    return { canonical: url, openGraphUrl: url };
  }
  if (!isExecutiveReceptionistHost(hostHeader)) {
    return { canonical: fallbackCanonical, openGraphUrl: fallbackOpenGraph };
  }
  const url = absoluteUrl(EXECUTIVE_RECEPTIONIST_ORIGIN, path);
  return { canonical: url, openGraphUrl: url };
}
