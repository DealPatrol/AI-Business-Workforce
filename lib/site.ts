const APP_FALLBACK = 'https://ai-business-workforce.vercel.app';

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

export function hostnameOf(value: string | null | undefined) {
  if (!value) return '';
  const first = value.split(',')[0]?.trim() || '';
  if (!first) return '';
  try {
    if (first.includes('://')) return new URL(first).hostname.toLowerCase();
    return new URL(`http://${first}`).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/** YardProof / app origin. Ignores localhost so production canonicals stay public. */
export function getAppUrl() {
  const app = originOf(process.env.NEXT_PUBLIC_APP_URL);
  if (app && !isLocalHost(hostnameOf(app))) return app;
  return APP_FALLBACK;
}

/**
 * Public origin for Ava canonicals, sitemap entries, and Open Graph URLs.
 * `NEXT_PUBLIC_SITE_URL` wins, then `SITE_URL`, then the app origin.
 */
export function getAvaSiteUrl() {
  const site = originOf(process.env.NEXT_PUBLIC_SITE_URL) || originOf(process.env.SITE_URL);
  if (site && !isLocalHost(hostnameOf(site))) return site;
  return getAppUrl();
}

export function avaUsesDedicatedHome() {
  return hostnameOf(getAvaSiteUrl()) !== hostnameOf(getAppUrl());
}

/** Path of the Ava marketing homepage on the Ava canonical origin. */
export function avaCanonicalHomePath() {
  return avaUsesDedicatedHome() ? '/' : '/ava';
}

export function avaAbsoluteUrl(path: string) {
  const base = getAvaSiteUrl();
  if (!path || path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function configuredMarketingHosts() {
  const hosts = new Set<string>();
  if (avaUsesDedicatedHome()) hosts.add(hostnameOf(getAvaSiteUrl()));
  const extra = `${process.env.AVA_MARKETING_HOSTS || ''},${process.env.NEXT_PUBLIC_AVA_MARKETING_HOSTS || ''}`;
  for (const part of extra.split(',')) {
    const host = hostnameOf(part.trim());
    if (host && !isLocalHost(host)) hosts.add(host);
  }
  return hosts;
}

export function isAvaMarketingHost(hostHeader: string | null | undefined) {
  const host = hostnameOf(hostHeader);
  if (!host) return false;
  return configuredMarketingHosts().has(host);
}

/** In-app href for the Ava homepage on the current request host. */
export function avaHomeHrefForHost(hostHeader: string | null | undefined, hash = '') {
  const path = isAvaMarketingHost(hostHeader) ? '/' : '/ava';
  return `${path}${hash}`;
}

export function avaPricingPathForOrigin(origin: string) {
  return isAvaMarketingHost(hostnameOf(origin)) ? '/#pricing' : '/ava#pricing';
}
