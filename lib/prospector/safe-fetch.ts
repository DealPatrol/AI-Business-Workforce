import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { htmlTitle, htmlToText } from '@/lib/prospector/email-extract';
import { PublicFetchError } from '@/lib/prospector/errors';
import { getSiteUrl } from '@/lib/site-url';

const BLOCKED_HOSTS = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.internal',
]);

export function isPrivateIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    const first = lower.split(':')[0] || '';
    if (first.startsWith('fe8') || first.startsWith('fe9') || first.startsWith('fea') || first.startsWith('feb')) {
      return true;
    }
    if (first.startsWith('fc') || first.startsWith('fd') || first.startsWith('ff')) return true;
    return false;
  }
  return true;
}

export function assertPublicUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new PublicFetchError('Enter a full website URL, including https://.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new PublicFetchError('Only http and https websites can be read.');
  }
  if (url.username || url.password) {
    throw new PublicFetchError('URLs with embedded passwords are blocked.');
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    throw new PublicFetchError('Custom ports are blocked.');
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (
    !host ||
    BLOCKED_HOSTS.has(host) ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost') ||
    /^\d+$/.test(host)
  ) {
    throw new PublicFetchError('That host is blocked.');
  }
  if (isIP(host) && isPrivateIp(host)) {
    throw new PublicFetchError('Private network addresses are blocked.');
  }
  url.hash = '';
  return url;
}

async function assertResolvedHostIsPublic(hostname: string): Promise<void> {
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new PublicFetchError('Private network addresses are blocked.');
    return;
  }
  let records: Array<{ address: string }>;
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new PublicFetchError('Could not resolve that website.');
  }
  if (records.length === 0 || records.some((record) => isPrivateIp(record.address))) {
    throw new PublicFetchError('That website resolves to a private network address.');
  }
}

async function readLimited(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Buffer[] = [];
  let received = 0;
  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    received += value.byteLength;
    chunks.push(Buffer.from(value));
  }
  await reader.cancel().catch(() => undefined);
  return Buffer.concat(chunks).subarray(0, maxBytes).toString('utf8');
}

export type FetchedPage = {
  finalUrl: string;
  html: string;
  text: string;
  title: string;
};

export async function fetchPublicHtml(rawUrl: string): Promise<FetchedPage> {
  let current = assertPublicUrl(rawUrl);
  const seen = new Set<string>();
  for (let hop = 0; hop < 3; hop += 1) {
    const key = current.toString();
    if (seen.has(key)) throw new PublicFetchError('That website redirected in a loop.');
    seen.add(key);
    await assertResolvedHostIsPublic(current.hostname);
    const response = await fetch(current, {
      redirect: 'manual',
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,text/plain;q=0.5',
        'User-Agent': `YardProofLeadFinder/1.0 (+${getSiteUrl()})`,
      },
      signal: AbortSignal.timeout(6_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new PublicFetchError('The website redirected without a destination.');
      current = assertPublicUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) throw new PublicFetchError(`The website returned HTTP ${response.status}.`);
    const type = (response.headers.get('content-type') || '').toLowerCase();
    if (type && !type.includes('text/html') && !type.includes('text/plain') && !type.includes('application/xhtml')) {
      throw new PublicFetchError('That URL is not an HTML page.');
    }
    const html = await readLimited(response, 400_000);
    return {
      finalUrl: current.toString(),
      html,
      text: htmlToText(html).slice(0, 12_000),
      title: htmlTitle(html),
    };
  }
  throw new PublicFetchError('That website redirected too many times.');
}
