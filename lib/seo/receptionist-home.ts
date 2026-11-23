/**
 * executivereceptionist.com is the one home for receptionist (Ava) content.
 * frontporchgrowth.com keeps the marketing services (postcards, free tools, Google Profile)
 * and sends its copies of receptionist pages to the matching executivereceptionist.com URL.
 */

/** HVAC receptionist pages merged into /hvac, the one main HVAC page. */
export const HVAC_MERGED_PATHS = ['/ava/ai-answering-service-for-hvac', '/receptionist/hvac'] as const;

/** /ava guide slugs that now live on another page and are left out of sitemaps and links. */
export const MERGED_AVA_GUIDES: Record<string, string> = {
  'ai-answering-service-for-hvac': '/hvac',
};

/** Exact receptionist paths that live only on executivereceptionist.com. */
const RECEPTIONIST_EXACT_PATHS = new Set([
  '/ava',
  '/hvac',
  '/receptionist-demo',
  '/start',
  '/business',
  '/dental',
  '/law',
  '/salon',
  '/auto-repair',
  '/med-spa',
  '/real-estate',
  '/industries',
  '/tools',
  '/templates',
]);

function normalize(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

/** Merged HVAC page target, or null. */
export function hvacMergeTarget(pathname: string) {
  return (HVAC_MERGED_PATHS as readonly string[]).includes(normalize(pathname)) ? '/hvac' : null;
}

/**
 * The executivereceptionist.com path for a receptionist page, or null when the path
 * belongs to Front Porch Growth (or is shared, such as /pricing, /privacy, /terms, /onboarding).
 */
export function receptionistHomePath(pathname: string): string | null {
  const path = normalize(pathname);
  const merged = hvacMergeTarget(path);
  if (merged) return merged;
  // /receptionist is the same document as the executivereceptionist.com home page.
  if (path === '/receptionist') return '/';
  if (RECEPTIONIST_EXACT_PATHS.has(path)) return path;
  if (path.startsWith('/ava/') || path.startsWith('/receptionist/')) return path;
  // Executive Receptionist comparisons, free tools and call scripts. Exact /compare stays on
  // Front Porch Growth (its own compare page); /compare/<slug> pages live only on executivereceptionist.com.
  if (path.startsWith('/compare/') || path.startsWith('/tools/') || path.startsWith('/templates/')) return path;
  return null;
}

/** Link target for an /ava guide slug, following merges. */
export function avaGuidePath(slug: string) {
  return MERGED_AVA_GUIDES[slug] ?? `/ava/${slug}`;
}
