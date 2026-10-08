const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const MAILTO_RE = /mailto:([^"'?\s>]+)/gi;
const CF_EMAIL_RE = /data-cfemail=["']([0-9a-f]+)["']/gi;

const JUNK_DOMAINS = [
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'email.com',
  'domain.com',
  'yourdomain.com',
  'yoursite.com',
  'sentry.io',
  'wixpress.com',
  'schema.org',
  'godaddy.com',
  'cloudflare.com',
  'mysite.com',
  'company.com',
  'domain.org',
  'wix.com',
  'squarespace.com',
  'placeholder.com',
  'sentry-next.wixpress.com',
];

const JUNK_LOCAL = new Set([
  'noreply',
  'no-reply',
  'donotreply',
  'do-not-reply',
  'mailer-daemon',
  'postmaster',
  'bounce',
  'bounces',
  'example',
  'test',
  'username',
  'yourname',
  'youremail',
  'email',
  'name',
  'user',
  'null',
  'undefined',
]);

const FILE_EXT = /\.(png|jpe?g|gif|svg|webp|css|js|ico|woff2?)$/i;
const NAME_PART = "[A-Z][a-z]+(?:[\\s'-][A-Z][a-z]+){0,3}";

export function htmlToText(html: string): string {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function htmlTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? htmlToText(match[1]).slice(0, 180) : '';
}

export function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => String.fromCharCode(Number(num)))
    .replace(/&commat;/gi, '@')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

export function decodeCloudflareEmail(hex: string): string | null {
  const clean = hex.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(clean) || clean.length < 4 || clean.length % 2 !== 0) return null;
  const key = parseInt(clean.slice(0, 2), 16);
  let email = '';
  for (let index = 2; index < clean.length; index += 2) {
    email += String.fromCharCode(parseInt(clean.slice(index, index + 2), 16) ^ key);
  }
  return email.includes('@') ? email : null;
}

export function isJunkEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(normalized)) return true;
  if (normalized.length > 120) return true;
  const at = normalized.lastIndexOf('@');
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  if (!local || !domain || local.includes('..') || domain.includes('..')) return true;
  if (FILE_EXT.test(normalized) || FILE_EXT.test(local) || FILE_EXT.test(domain)) return true;
  if (JUNK_LOCAL.has(local)) return true;
  if (local.includes('example') || local.includes('placeholder') || local.includes('sentry')) return true;
  if (JUNK_DOMAINS.some((suffix) => domain === suffix || domain.endsWith(`.${suffix}`))) return true;
  return false;
}

function rememberEmail(found: Set<string>, raw: string) {
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    /* Keep the raw value when it is not valid percent-encoding. */
  }
  value = value.split('?')[0].replace(/^mailto:/i, '').trim();
  if (!value || isJunkEmail(value)) return;
  found.add(value.toLowerCase());
}

export function extractEmails(html: string): string[] {
  const decoded = decodeEntities(html);
  const found = new Set<string>();

  for (const match of decoded.matchAll(CF_EMAIL_RE)) {
    const email = decodeCloudflareEmail(match[1] ?? '');
    if (email) rememberEmail(found, email);
  }
  for (const match of decoded.matchAll(MAILTO_RE)) {
    rememberEmail(found, match[1] ?? '');
  }
  for (const match of decoded.matchAll(EMAIL_RE)) {
    rememberEmail(found, match[0] ?? '');
  }

  return [...found];
}

function htmlToLines(html: string): string[] {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h\d|tr|section)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

export function extractContactNames(html: string): string[] {
  const patterns = [
    new RegExp(`(?:Owner|Manager|Founder|Proprietor|President)\\s*[:\\-]\\s*(${NAME_PART})\\b`),
    new RegExp(`(${NAME_PART})\\s*,\\s*(?:Owner|General Manager|Manager|Founder)\\b`),
    new RegExp(`(?:Owned|Managed|Founded)\\s+by\\s+(${NAME_PART})\\b`),
  ];
  const names = new Set<string>();
  for (const line of htmlToLines(html)) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      const name = match?.[1]?.trim();
      if (!name || name.length > 40) continue;
      if (/\b(Owner|Manager|Founder|Managed|Owned|Contact)\b/.test(name)) continue;
      names.add(name);
    }
  }
  return [...names].slice(0, 3);
}

const CONTACT_PATHS: Array<{ score: number; pattern: RegExp }> = [
  { score: 0, pattern: /contact/ },
  { score: 1, pattern: /about/ },
  { score: 2, pattern: /team|staff|our-story|meet-the/ },
];

export function pickContactLinks(html: string, baseUrl: string, limit = 2): string[] {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }
  const baseHost = base.hostname.replace(/^www\./i, '').toLowerCase();
  const scored: Array<{ url: string; score: number }> = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const href = match[1]?.trim();
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) continue;
    let url: URL;
    try {
      url = new URL(href, base);
    } catch {
      continue;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    if (host !== baseHost) continue;
    const haystack = `${url.pathname} ${url.href}`.toLowerCase();
    const matchPath = CONTACT_PATHS.find((item) => item.pattern.test(haystack));
    if (!matchPath) continue;
    url.hash = '';
    const key = url.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    scored.push({ url: key, score: matchPath.score });
  }

  scored.sort((left, right) => left.score - right.score || left.url.localeCompare(right.url));
  return scored.slice(0, limit).map((item) => item.url);
}
