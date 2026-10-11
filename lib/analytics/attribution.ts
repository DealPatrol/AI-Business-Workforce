export const ATTRIBUTION_KEYS = [
  'gclid',
  'fbclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type Attribution = Partial<Record<AttributionKey, string>>;

const STORAGE_KEY = 'ava_ad_attribution';

function cleanValue(value: string) {
  let cleaned = '';
  for (const char of value) {
    const code = char.charCodeAt(0);
    cleaned += code < 32 || code === 127 ? ' ' : char;
  }
  return cleaned.trim().slice(0, 200);
}

export function sanitizeAttribution(value: unknown): Attribution {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const out: Attribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    const raw = cleanValue(String(record[key] ?? ''));
    if (raw) out[key] = raw;
  }
  return out;
}

export function readAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  try {
    return sanitizeAttribution(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}'));
  } catch {
    return {};
  }
}

function readCookie(name: string) {
  if (typeof document === 'undefined') return '';
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

export function readBrowserIds() {
  const fbp = readCookie('_fbp').slice(0, 200);
  const fbc = (readCookie('_fbc') || readCookie('ava_fbc')).slice(0, 200);
  return { fbp, fbc };
}

export function captureAttributionFromLocation() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const incoming: Attribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    const raw = cleanValue(params.get(key) || '');
    if (raw) incoming[key] = raw;
  }

  const fbclid = incoming.fbclid;
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    document.cookie = `ava_fbc=${encodeURIComponent(fbc)}; path=/; max-age=7776000; samesite=lax`;
  }

  if (Object.keys(incoming).length === 0) return;
  try {
    const merged = { ...readAttribution(), ...incoming };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Storage can be blocked. Ads measurement still works from the URL on this page view.
  }
}
