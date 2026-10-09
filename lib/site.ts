const SITE_FALLBACK = 'https://frontporchgrowth.com';

function originOf(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) return '';
  try {
    const withProtocol = raw.includes('://') ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.origin;
  } catch {
    return '';
  }
}

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
}

/**
 * Public origin for metadataBase, canonicals, sitemap, robots, and Open Graph.
 * `NEXT_PUBLIC_SITE_URL` wins when it is a public http(s) origin. Otherwise
 * the site falls back to https://frontporchgrowth.com.
 */
export function getSiteUrl() {
  const configured = originOf(process.env.NEXT_PUBLIC_SITE_URL);
  if (!configured) return SITE_FALLBACK;
  try {
    if (isLocalHost(new URL(configured).hostname)) return SITE_FALLBACK;
  } catch {
    return SITE_FALLBACK;
  }
  return configured;
}

export function absoluteUrl(path: string) {
  const base = getSiteUrl();
  if (!path || path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
