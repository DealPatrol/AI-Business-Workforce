import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';
import { PublicFetchError } from '@/lib/prospector/errors';
import { assertPublicUrl, pinnedLookup, resolvePublicAddress } from '@/lib/prospector/safe-fetch';
import { getSiteUrl } from '@/lib/site-url';

export type GraderFetchResult = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  contentType: string;
  body: string;
  bytes: number;
  truncated: boolean;
  /** Milliseconds from request start to response headers on the final hop. */
  responseMs: number;
  /** Milliseconds for the whole fetch, including redirects and body download. */
  totalMs: number;
  redirects: string[];
};

type RawResponse = {
  status: number;
  headers: http.IncomingHttpHeaders;
  stream: http.IncomingMessage;
};

function userAgent() {
  return `FrontPorchGrowthGrader/1.0 (+${getSiteUrl()}/ai-visibility)`;
}

function requestPinned(url: URL, address: string, family: 4 | 6, timeoutMs: number, accept: string): Promise<RawResponse> {
  const mod = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = mod.request(
      url,
      {
        method: 'GET',
        lookup: pinnedLookup(address, family),
        servername: isIP(url.hostname.replace(/^\[|\]$/g, '')) ? undefined : url.hostname,
        agent: false,
        headers: {
          Accept: accept,
          'Accept-Encoding': 'identity',
          'User-Agent': userAgent(),
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

async function readLimited(stream: http.IncomingMessage, maxBytes: number) {
  const chunks: Buffer[] = [];
  let received = 0;
  let truncated = false;
  try {
    for await (const chunk of stream) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(buf);
      received += buf.byteLength;
      if (received >= maxBytes) {
        truncated = true;
        break;
      }
    }
  } finally {
    stream.destroy();
  }
  const all = Buffer.concat(chunks);
  return { body: all.subarray(0, maxBytes).toString('utf8'), bytes: received, truncated };
}

/**
 * SSRF-safe GET for the grader. Public http(s) hosts only, DNS pinned per hop,
 * at most 4 redirects, a hard deadline, and a byte cap. Any status is returned
 * (the caller decides what a 404 means), but network problems throw PublicFetchError.
 */
export async function graderFetch(
  rawUrl: string,
  options: { timeoutMs?: number; maxBytes?: number; accept?: string } = {},
): Promise<GraderFetchResult> {
  const timeoutMs = options.timeoutMs ?? 8_000;
  const maxBytes = options.maxBytes ?? 1_500_000;
  const accept = options.accept ?? 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5';
  const started = Date.now();
  const deadline = started + timeoutMs;
  let current = assertPublicUrl(rawUrl);
  const requestedUrl = current.toString();
  const redirects: string[] = [];
  const seen = new Set<string>();

  for (let hop = 0; hop < 5; hop += 1) {
    const key = current.toString();
    if (seen.has(key)) throw new PublicFetchError('That website redirected in a loop.');
    seen.add(key);
    const { address, family } = await resolvePublicAddress(current.hostname);
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new PublicFetchError('The website took too long to respond.');
    const hopStarted = Date.now();
    const response = await requestPinned(current, address, family, remaining, accept);
    const responseMs = Date.now() - hopStarted;
    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      response.stream.destroy();
      current = assertPublicUrl(new URL(response.headers.location, current).toString());
      redirects.push(current.toString());
      continue;
    }
    const { body, bytes, truncated } = await readLimited(response.stream, maxBytes);
    return {
      requestedUrl,
      finalUrl: current.toString(),
      status: response.status,
      contentType: String(response.headers['content-type'] || '').toLowerCase(),
      body,
      bytes,
      truncated,
      responseMs,
      totalMs: Date.now() - started,
      redirects,
    };
  }
  throw new PublicFetchError('That website redirected too many times.');
}
