const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'] as const;

/**
 * Copy utm_* query params from a page URL onto a destination such as a Stripe payment link.
 * Other query params are left off the destination.
 */
export function withUtmParams(href: string, search: string | URLSearchParams): string {
  const params =
    typeof search === 'string' ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search) : search;
  const url = new URL(href);
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}
