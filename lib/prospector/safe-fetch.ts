import { lookup as dnsLookup } from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { isIP, type LookupFunction } from 'node:net';
import { htmlTitle, htmlToText } from '@/lib/prospector/email-extract';
import { PublicFetchError } from '@/lib/prospector/errors';

const BLOCKED_HOSTS = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.internal',
]);

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return true;
  const [a, b, c] = parts;
  if (a === 0) return true; // 0.0.0.0/8 "this network"
  if (a === 10) return true; // RFC1918
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
  if (a === 192 && b === 0 && c === 0) return true; // IETF protocol assignments
  if (a === 192 && b === 0 && c === 2) return true; // TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
  if (a === 192 && b === 88 && c === 99) return true; // 6to4 relay anycast
  if (a >= 224) return true; // multicast, reserved, broadcast
  return false;
}

/** Expands an IPv6 literal (optionally with embedded IPv4) to 8 16-bit groups. */
function ipv6Groups(ip: string): number[] | null {
  let addr = ip.toLowerCase().split('%')[0];
  const v4 = addr.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const o = v4[1].split('.').map(Number);
    if (o.some((n) => n > 255)) return null;
    addr = `${addr.slice(0, -v4[1].length)}${((o[0] << 8) | o[1]).toString(16)}:${((o[2] << 8) | o[3]).toString(16)}`;
  }
  const halves = addr.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail];
  const parsed = groups.map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN));
  return parsed.some(Number.isNaN) ? null : parsed;
}

function embeddedV4(hi: number, lo: number): string {
  return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
}

function isPrivateIpv6(ip: string): boolean {
  const g = ipv6Groups(ip);
  if (!g) return true;
  const zeroPrefix = (n: number) => g.slice(0, n).every((x) => x === 0);
  if (zeroPrefix(8)) return true; // ::
  if (zeroPrefix(7) && g[7] === 1) return true; // ::1
  if (zeroPrefix(5) && g[5] === 0xffff) return isPrivateIpv4(embeddedV4(g[6], g[7])); // ::ffff:a.b.c.d
  if (zeroPrefix(4) && g[4] === 0xffff && g[5] === 0) return true; // ::ffff:0:a.b.c.d (SIIT)
  if (zeroPrefix(6)) return true; // deprecated IPv4-compatible ::a.b.c.d
  if (g[0] === 0x64 && g[1] === 0xff9b) {
    // 64:ff9b::/96 NAT64 well-known prefix and 64:ff9b:1::/48 local-use
    if (g[2] === 1) return true;
    return isPrivateIpv4(embeddedV4(g[6], g[7]));
  }
  if (g[0] === 0x2002) return isPrivateIpv4(embeddedV4(g[1], g[2])); // 6to4
  if (g[0] === 0x2001 && g[1] === 0) return true; // Teredo (embeds obfuscated IPv4)
  if (g[0] === 0x2001 && g[1] === 0xdb8) return true; // documentation
  if (g[0] === 0x0100 && g[1] === 0 && g[2] === 0 && g[3] === 0) return true; // discard-only 100::/64
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g[0] & 0xffc0) === 0xfec0) return true; // fec0::/10 deprecated site-local
  if ((g[0] & 0xff00) === 0xff00) return true; // multicast
  if ((g[0] & 0xe000) !== 0x2000) return true; // only 2000::/3 is global unicast
  return false;
}

export function isPrivateIp(raw: string): boolean {
  const ip = raw.replace(/^\[|\]$/g, '');
  const version = isIP(ip.split('%')[0]);
  if (version === 4) return isPrivateIpv4(ip);
  if (version === 6) return isPrivateIpv6(ip);
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
  const host = url.hostname.toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '');
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

type LookupResult = Array<{ address: string; family: number }>;
type Resolver = (hostname: string) => Promise<LookupResult>;

const systemResolver: Resolver = (hostname) =>
  new Promise((resolve, reject) => {
    dnsLookup(hostname, { all: true, verbatim: true }, (err, addresses) => (err ? reject(err) : resolve(addresses)));
  });

/**
 * Resolves the host exactly once and rejects if ANY record is non-public.
 * Returns the vetted address that the socket must connect to.
 */
export async function resolvePublicAddress(
  hostname: string,
  resolver: Resolver = systemResolver,
): Promise<{ address: string; family: 4 | 6 }> {
  const bare = hostname.replace(/^\[|\]$/g, '');
  const literal = isIP(bare);
  if (literal) {
    if (isPrivateIp(bare)) throw new PublicFetchError('Private network addresses are blocked.');
    return { address: bare, family: literal as 4 | 6 };
  }
  let records: LookupResult;
  try {
    records = await resolver(bare);
  } catch {
    throw new PublicFetchError('Could not resolve that website.');
  }
  if (records.length === 0 || records.some((record) => isPrivateIp(record.address))) {
    throw new PublicFetchError('That website resolves to a private network address.');
  }
  const first = records[0];
  return { address: first.address, family: (first.family === 6 ? 6 : 4) };
}

/**
 * A net/tls lookup hook that ignores the requested hostname's live DNS and
 * returns only the pre-vetted address, so a DNS-rebinding answer can never be
 * used for the actual connection. It also re-validates the address defensively.
 */
export function pinnedLookup(address: string, family: 4 | 6): LookupFunction {
  return ((_hostname: string, options: { all?: boolean } | number | undefined, callback: (...args: unknown[]) => void) => {
    const cb = typeof options === 'function' ? (options as (...args: unknown[]) => void) : callback;
    if (isPrivateIp(address)) {
      cb(new PublicFetchError('Private network addresses are blocked.'));
      return;
    }
    if (typeof options === 'object' && options?.all) cb(null, [{ address, family }]);
    else cb(null, address, family);
  }) as unknown as LookupFunction;
}

type RawResponse = {
  status: number;
  headers: http.IncomingHttpHeaders;
  stream: http.IncomingMessage;
};

function requestPinned(url: URL, address: string, family: 4 | 6, timeoutMs: number): Promise<RawResponse> {
  const mod = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = mod.request(
      url,
      {
        method: 'GET',
        lookup: pinnedLookup(address, family),
        // Keep SNI/cert validation tied to the real hostname.
        servername: isIP(url.hostname.replace(/^\[|\]$/g, '')) ? undefined : url.hostname,
        agent: false,
        headers: {
          Accept: 'text/html,application/xhtml+xml;q=0.9,text/plain;q=0.5',
          'Accept-Encoding': 'identity',
          'User-Agent': 'YardProofLeadFinder/1.0 (+https://ai-business-workforce.vercel.app)',
        },
        timeout: timeoutMs,
      },
      (res) => resolve({ status: res.statusCode || 0, headers: res.headers, stream: res }),
    );
    req.on('timeout', () => req.destroy(new PublicFetchError('The website took too long to respond.')));
    req.on('error', (err) =>
      reject(err instanceof PublicFetchError ? err : new PublicFetchError('Could not load that website.')),
    );
    req.end();
  });
}

async function readLimited(stream: http.IncomingMessage, maxBytes: number): Promise<string> {
  const chunks: Buffer[] = [];
  let received = 0;
  try {
    for await (const chunk of stream) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(buf);
      received += buf.byteLength;
      if (received >= maxBytes) break;
    }
  } finally {
    stream.destroy();
  }
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
  const deadline = Date.now() + 6_000;
  for (let hop = 0; hop < 3; hop += 1) {
    const key = current.toString();
    if (seen.has(key)) throw new PublicFetchError('That website redirected in a loop.');
    seen.add(key);
    // Resolve once per hop and connect to exactly that vetted address.
    const { address, family } = await resolvePublicAddress(current.hostname);
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new PublicFetchError('The website took too long to respond.');
    const response = await requestPinned(current, address, family, remaining);
    if (response.status >= 300 && response.status < 400) {
      response.stream.destroy();
      const location = response.headers.location;
      if (!location) throw new PublicFetchError('The website redirected without a destination.');
      current = assertPublicUrl(new URL(location, current).toString());
      continue;
    }
    if (response.status < 200 || response.status >= 300) {
      response.stream.destroy();
      throw new PublicFetchError(`The website returned HTTP ${response.status}.`);
    }
    const type = String(response.headers['content-type'] || '').toLowerCase();
    if (type && !type.includes('text/html') && !type.includes('text/plain') && !type.includes('application/xhtml')) {
      response.stream.destroy();
      throw new PublicFetchError('That URL is not an HTML page.');
    }
    const html = await readLimited(response.stream, 400_000);
    return {
      finalUrl: current.toString(),
      html,
      text: htmlToText(html).slice(0, 12_000),
      title: htmlTitle(html),
    };
  }
  throw new PublicFetchError('That website redirected too many times.');
}
