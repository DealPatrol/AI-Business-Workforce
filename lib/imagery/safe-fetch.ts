/**
 * Server-only image fetch with a strict host allowlist (SSRF guard).
 *
 * Only two upstreams are ever fetched by the imagery pipeline:
 *   1. Our Supabase project's Storage API  (https://<ref>.supabase.co/storage/v1/object/...)
 *   2. Google Street View / Static Maps    (https://maps.googleapis.com/maps/api/streetview|staticmap)
 *
 * Anything else (other hosts, http:, IP literals, credentials in URL, redirects
 * to a different host) is rejected before a request is made.
 */

const GOOGLE_MAPS_HOST = 'maps.googleapis.com';
const GOOGLE_ALLOWED_PATHS = ['/maps/api/streetview', '/maps/api/staticmap'];
const SUPABASE_STORAGE_PREFIX = '/storage/v1/object/';

/** Hard cap on downloaded bytes (gpt-image-1 edit input limit is 50 MB; SV is ~100 KB). */
const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;

export class ImageFetchBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageFetchBlockedError';
  }
}

function supabaseStorageHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export type AllowedImageSource = 'supabase_storage' | 'google_maps';

/** Returns which allowlisted upstream a URL belongs to, or throws. */
export function assertAllowedImageUrl(rawUrl: string): { url: URL; source: AllowedImageSource } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ImageFetchBlockedError('Image URL is not a valid absolute URL.');
  }

  if (url.protocol !== 'https:') {
    throw new ImageFetchBlockedError('Image URL must use https.');
  }
  if (url.username || url.password) {
    throw new ImageFetchBlockedError('Image URL must not contain credentials.');
  }
  if (url.port && url.port !== '443') {
    throw new ImageFetchBlockedError('Image URL must not use a custom port.');
  }

  const host = url.hostname.toLowerCase();
  const storageHost = supabaseStorageHost();

  if (storageHost && host === storageHost && url.pathname.startsWith(SUPABASE_STORAGE_PREFIX)) {
    return { url, source: 'supabase_storage' };
  }

  if (
    host === GOOGLE_MAPS_HOST &&
    GOOGLE_ALLOWED_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))
  ) {
    return { url, source: 'google_maps' };
  }

  // Never echo the full URL (Google URLs carry the Maps key).
  throw new ImageFetchBlockedError(`Image host "${host}" is not on the imagery allowlist.`);
}

/**
 * Fetch an image from an allowlisted host. Redirects are not followed
 * (a 3xx is treated as an error) so an allowed host cannot bounce us elsewhere.
 */
export async function fetchAllowedImage(
  rawUrl: string,
  opts: { maxBytes?: number } = {},
): Promise<{ bytes: Buffer; mimeType: string; source: AllowedImageSource }> {
  const { url, source } = assertAllowedImageUrl(rawUrl);
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;

  const response = await fetch(url.toString(), {
    cache: 'no-store',
    redirect: 'manual',
    signal: AbortSignal.timeout(20_000),
  });

  if (response.status >= 300 && response.status < 400) {
    throw new ImageFetchBlockedError(`Image fetch was redirected (HTTP ${response.status}); redirects are not allowed.`);
  }
  if (!response.ok) {
    throw new Error(`Image download failed (HTTP ${response.status}).`);
  }

  const mimeType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!mimeType.startsWith('image/')) {
    throw new Error(`Image download returned non-image content-type (${mimeType || 'unknown'}).`);
  }

  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared && declared > maxBytes) {
    throw new Error(`Image is too large (${declared} bytes > ${maxBytes}).`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > maxBytes) {
    throw new Error(`Image is too large (${bytes.length} bytes > ${maxBytes}).`);
  }

  return { bytes, mimeType, source };
}
