const FALLBACK_SITE_URL = 'https://frontporchgrowth.com';

/** Previous production host. Page routes 308 to the public site. API and static files stay. */
export const LEGACY_VERCEL_HOST = 'ai-business-workforce.vercel.app';

function originOf(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) return '';
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.origin;
  } catch {
    return '';
  }
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

/**
 * Public site origin.
 * NEXT_PUBLIC_SITE_URL || NEXT_PUBLIC_APP_URL || https://frontporchgrowth.com
 */
export function getSiteUrl() {
  return (
    originOf(process.env.NEXT_PUBLIC_SITE_URL) ||
    originOf(process.env.NEXT_PUBLIC_APP_URL) ||
    FALLBACK_SITE_URL
  );
}

export function absoluteSiteUrl(path: string) {
  const base = getSiteUrl();
  if (!path || path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Executive Receptionist-at-root mode. Off unless AVA_STANDALONE_HOST names a host that is
 * neither the public site nor the legacy Vercel host. Leave it unset:
 * YardMailer stays at / and Executive Receptionist stays at /ava.
 */
export function isAvaStandaloneHost(hostHeader: string | null | undefined) {
  const configured = hostnameOf(process.env.AVA_STANDALONE_HOST);
  if (!configured) return false;
  const host = hostnameOf(hostHeader);
  if (!host || host !== configured) return false;
  if (host === hostnameOf(getSiteUrl())) return false;
  if (host === LEGACY_VERCEL_HOST) return false;
  return true;
}

const EXECUTIVE_RECEPTIONIST_HOSTS = new Set([
  'executivereceptionist.com',
  'www.executivereceptionist.com',
]);

/** Dedicated marketing host for the Executive Receptionist landing page. */
export function isExecutiveReceptionistHost(hostHeader: string | null | undefined) {
  return EXECUTIVE_RECEPTIONIST_HOSTS.has(hostnameOf(hostHeader));
}

/** Page paths that should leave the legacy Vercel host. Never /api, /_next, or files. */
export function isLegacyHostPagePath(pathname: string) {
  if (pathname === '/api' || pathname.startsWith('/api/')) return false;
  if (pathname === '/_next' || pathname.startsWith('/_next/')) return false;
  const leaf = pathname.split('/').pop() || '';
  if (leaf.includes('.')) return false;
  return true;
}
