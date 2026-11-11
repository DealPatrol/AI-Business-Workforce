const ALLOWED_RETURN_PATHS = new Set([
  '/desk',
  '/dashboard',
  '/dashboard/campaigns',
  '/dashboard/leads',
  '/dashboard/bookings',
  '/dashboard/prospector',
  '/dashboard/prospector/settings',
]);

/** Only same-site paths we know about; everything else lands on the desk. */
export function safeReturnPath(next: string | null | undefined) {
  if (!next) return '/desk';
  if (ALLOWED_RETURN_PATHS.has(next)) return next;
  if (/^\/dashboard\/leads\/[0-9a-f-]{36}$/i.test(next)) return next;
  if (next === '/sales' || /^\/demo\/[a-z0-9-]+$/.test(next)) return next;
  return '/desk';
}
