/**
 * Public /q/[token] imagery — server only.
 *
 * Rules:
 * - Only show recipient Current + After when human review_status === 'approved'.
 * - Never hand out the long-lived signed URLs stored in the DB. Re-derive the
 *   object path inside the private imagery bucket and mint a short-lived signed
 *   URL per page view.
 * - If nothing approved/signable, fall back to the legacy concept image, but
 *   never a URL that points into the private imagery bucket (after-render also
 *   writes the unreviewed After into concept_image_url).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
  throw new Error('lib/imagery/public-imagery is server-only.');
}

/** Short-lived signed URL lifetime for the public QR page (seconds). */
export const PUBLIC_IMAGERY_SIGNED_URL_TTL_SECONDS = 600;

const ACCEPTED_CURRENT_SOURCES = new Set(['street_view', 'crew_photo', 'owner_upload']);
const STORAGE_OBJECT_PATH = /^\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/]+)\/(.+)$/;

function supabaseHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).host;
  } catch {
    return null;
  }
}

function safeDecode(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

/**
 * Resolve a stored imagery reference (Supabase Storage URL of any flavor, or a
 * raw object path) to an object path inside `bucket`. Returns null when the
 * reference is not in that bucket or lives outside the recipient's folder.
 */
export function resolveImageryObjectPath(
  value: string | null | undefined,
  bucket: string,
  recipientId: string,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  let path: string | null = null;
  if (/^https?:\/\//i.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return null;
    }
    const host = supabaseHost();
    if (!host || url.host !== host) return null;
    const match = STORAGE_OBJECT_PATH.exec(url.pathname);
    if (!match || safeDecode(match[1]) !== bucket) return null;
    const decoded = match[2].split('/').map(safeDecode);
    if (decoded.some((segment) => segment === null)) return null;
    path = decoded.join('/');
  } else {
    path = trimmed.replace(/^\/+/, '');
    if (path.startsWith(`${bucket}/`)) path = path.slice(bucket.length + 1);
  }

  if (!path) return null;
  const segments = path.split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..')) return null;
  if (segments[0] !== recipientId || segments.length < 2) return null;
  return path;
}

/** True when the URL/path points at an object in the private imagery bucket. */
export function isPrivateImageryReference(value: string | null | undefined, bucket: string): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    const match = STORAGE_OBJECT_PATH.exec(url.pathname);
    return Boolean(match && safeDecode(match[1]) === bucket);
  } catch {
    return false;
  }
}

export type PublicImageryInput = {
  id: string;
  review_status: string | null;
  current_image_url: string | null;
  current_image_source: string | null;
  after_image_url: string | null;
  concept_image_url: string | null;
  concept_json?: Record<string, unknown> | null;
};

export type PublicImagery =
  | { kind: 'approved'; currentUrl: string; afterUrl: string }
  | { kind: 'concept'; conceptUrl: string }
  | { kind: 'none' };

function afterStoragePathFromConcept(conceptJson: PublicImageryInput['concept_json']): string | null {
  const after = conceptJson && typeof conceptJson === 'object' ? conceptJson.after : null;
  if (after && typeof after === 'object' && 'storagePath' in after) {
    const value = (after as { storagePath?: unknown }).storagePath;
    return typeof value === 'string' ? value : null;
  }
  return null;
}

/** Pure selection: which object paths (if any) are approved for public display. */
export function selectApprovedImageryPaths(
  recipient: PublicImageryInput,
  bucket: string,
): { currentPath: string; afterPath: string } | null {
  if (recipient.review_status !== 'approved') return null;
  if (!recipient.current_image_source || !ACCEPTED_CURRENT_SOURCES.has(recipient.current_image_source)) {
    return null;
  }
  if (!recipient.current_image_url || !recipient.after_image_url) return null;

  const currentPath = resolveImageryObjectPath(recipient.current_image_url, bucket, recipient.id);
  const afterPath = resolveImageryObjectPath(recipient.after_image_url, bucket, recipient.id);
  if (!currentPath || !afterPath) return null;

  // If after-render recorded the storage path, it must agree with the approved After URL.
  const recordedAfter = afterStoragePathFromConcept(recipient.concept_json);
  if (recordedAfter && recordedAfter !== afterPath) return null;

  return { currentPath, afterPath };
}

function legacyConcept(recipient: PublicImageryInput, bucket: string): PublicImagery {
  const concept = recipient.concept_image_url?.trim();
  if (!concept || isPrivateImageryReference(concept, bucket)) return { kind: 'none' };
  return { kind: 'concept', conceptUrl: concept };
}

/**
 * Build the imagery to render on /q/[token]. Approved Current + After are
 * served via fresh short-lived signed URLs; everything else falls back to the
 * legacy concept image (never a private-bucket URL).
 */
export async function getPublicRecipientImagery(
  admin: SupabaseClient,
  recipient: PublicImageryInput,
  bucket: string,
): Promise<PublicImagery> {
  const paths = selectApprovedImageryPaths(recipient, bucket);
  if (!paths) return legacyConcept(recipient, bucket);

  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrls([paths.currentPath, paths.afterPath], PUBLIC_IMAGERY_SIGNED_URL_TTL_SECONDS);

  const byPath = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) byPath.set(item.path, item.signedUrl);
  }
  const currentUrl = byPath.get(paths.currentPath);
  const afterUrl = byPath.get(paths.afterPath);

  if (error || !currentUrl || !afterUrl) {
    console.error('QR page: could not sign approved imagery', error ?? 'missing signed URL');
    return legacyConcept(recipient, bucket);
  }

  return { kind: 'approved', currentUrl, afterUrl };
}
