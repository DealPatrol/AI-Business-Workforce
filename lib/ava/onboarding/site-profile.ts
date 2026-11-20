/**
 * Drafts a business profile for Ava from a business's own website HTML.
 * Pure functions, no network: the API route fetches pages with fetchPublicHtml and passes the HTML here.
 * Everything returned is a draft the owner reviews before submitting onboarding.
 */
import { decodeEntities, htmlTitle, htmlToText } from '@/lib/prospector/email-extract';

export type SiteFaq = { q: string; a: string };

export type SiteProfile = {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  serviceArea: string;
  services: string[];
  faqs: SiteFaq[];
  description: string;
  sources: string[];
};

export function emptySiteProfile(): SiteProfile {
  return { businessName: '', phone: '', email: '', address: '', hours: '', serviceArea: '', services: [], faqs: [], description: '', sources: [] };
}

const DAY_NAMES: Record<string, string> = {
  mo: 'Mon', monday: 'Mon', tu: 'Tue', tuesday: 'Tue', we: 'Wed', wednesday: 'Wed', th: 'Thu', thursday: 'Thu',
  fr: 'Fri', friday: 'Fri', sa: 'Sat', saturday: 'Sat', su: 'Sun', sunday: 'Sun',
};

function clean(value: unknown, max = 300): string {
  if (typeof value !== 'string') return '';
  return htmlToText(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/** All JSON-LD nodes on the page, flattened through @graph. Bad JSON is skipped. */
export function jsonLdNodes(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const stack = asArray(parsed);
      while (stack.length) {
        const node = stack.shift();
        if (!node || typeof node !== 'object') continue;
        const record = node as Record<string, unknown>;
        out.push(record);
        if (Array.isArray(record['@graph'])) stack.push(...(record['@graph'] as unknown[]));
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return out;
}

function types(node: Record<string, unknown>): string[] {
  return asArray(node['@type'] as string | string[]).map((t) => String(t).toLowerCase());
}

const BUSINESS_TYPES = /business|organization|store|contractor|plumber|electrician|hvac|roofing|dentist|attorney|legalservice|salon|autorepair|homeandconstruction|medical|restaurant|service/;

function formatTime(raw: string): string {
  const m = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return raw;
  let h = Number(m[1]);
  const min = m[2];
  const suffix = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return min === '00' ? `${h}${suffix}` : `${h}:${min}${suffix}`;
}

function dayLabel(raw: string): string {
  const key = raw.replace(/^https?:\/\/schema\.org\//i, '').toLowerCase();
  return DAY_NAMES[key] ?? raw;
}

/** "Mo-Fr 08:00-17:00" strings or OpeningHoursSpecification objects to "Mon–Fri 8am–5pm". */
export function hoursFromSchema(node: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const spec of asArray(node.openingHours as string | string[])) {
    const m = String(spec).match(/^([A-Za-z,\- ]+)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (m) {
      const days = m[1].trim().split(/\s*,\s*/).map((d) => d.split('-').map(dayLabel).join('–')).join(', ');
      parts.push(`${days} ${formatTime(m[2])}–${formatTime(m[3])}`);
    } else if (String(spec).trim()) {
      parts.push(String(spec).trim());
    }
  }
  for (const spec of asArray(node.openingHoursSpecification as Record<string, unknown>[])) {
    if (!spec || typeof spec !== 'object') continue;
    const days = asArray(spec.dayOfWeek as string | string[]).map(dayLabel);
    const opens = typeof spec.opens === 'string' ? formatTime(spec.opens) : '';
    const closes = typeof spec.closes === 'string' ? formatTime(spec.closes) : '';
    if (days.length && opens && closes) parts.push(`${days.join(', ')} ${opens}–${closes}`);
  }
  return Array.from(new Set(parts)).join('; ').slice(0, 300);
}

function addressText(value: unknown): string {
  if (typeof value === 'string') return clean(value, 200);
  if (!value || typeof value !== 'object') return '';
  const a = value as Record<string, unknown>;
  return [a.streetAddress, a.addressLocality, [a.addressRegion, a.postalCode].filter(Boolean).join(' ')]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean)
    .join(', ')
    .slice(0, 200);
}

function areaText(value: unknown): string {
  return asArray(value as unknown[])
    .map((v) => (typeof v === 'string' ? v : v && typeof v === 'object' ? String((v as Record<string, unknown>).name ?? '') : ''))
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 12)
    .join(', ');
}

/** Hours written in page text, e.g. "Monday - Friday: 7:00 AM - 5:00 PM". */
export function hoursFromText(text: string): string {
  const day = '(?:Mon(?:day)?|Tue(?:s|sday)?|Wed(?:nesday)?|Thu(?:rs|rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)';
  const time = '\\d{1,2}(?::\\d{2})?\\s*(?:[ap]\\.?m\\.?)';
  const re = new RegExp(`${day}(?:\\s*(?:-|–|to|through)\\s*${day})?\\s*:?\\s*${time}\\s*(?:-|–|to)\\s*${time}`, 'gi');
  const found = text.match(re) || [];
  const out = Array.from(new Set(found.map((s) => s.replace(/\s+/g, ' ').trim())));
  if (/\b24\s*\/\s*7\b|24 hours a day|open 24 hours/i.test(text) && !out.length) return 'Open 24/7 (from the website)';
  return out.slice(0, 4).join('; ');
}

export function phoneFromText(text: string): string {
  const m = text.match(/(?:\+?1[\s.-]?)?\(?([2-9]\d{2})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})\b/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : '';
}

function meta(html: string, name: string): string {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? clean(decodeEntities(content), 300) : '';
}

const HEADING_SKIP = /^(home|about|about us|contact|contact us|menu|reviews?|testimonials?|blog|gallery|faqs?|frequently asked questions|why choose us|our team|get a quote|call now|request service|careers|privacy|terms|follow us|hours|location|service areas?|our services|services|what we do|news|search)$/i;

/** Short headings (h2/h3) and service-list links are a decent first draft of the service menu. */
export function servicesFromHtml(html: string): string[] {
  const out: string[] = [];
  const re = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const text = clean(m[1], 80);
    if (!text || text.length < 4 || text.length > 60 || /[?!]$/.test(text) || HEADING_SKIP.test(text)) continue;
    if (text.split(' ').length > 7) continue;
    out.push(text);
  }
  const linkRe = /<a[^>]+href=["'][^"']*\/services?\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = linkRe.exec(html))) {
    const text = clean(m[1], 60);
    if (text && text.length >= 4 && text.split(' ').length <= 6 && !HEADING_SKIP.test(text)) out.push(text);
  }
  const seen = new Set<string>();
  return out.filter((s) => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}

/** FAQ pairs from FAQPage JSON-LD, then from <details><summary> blocks. */
export function faqsFromHtml(html: string, nodes = jsonLdNodes(html)): SiteFaq[] {
  const out: SiteFaq[] = [];
  for (const node of nodes) {
    if (!types(node).includes('faqpage')) continue;
    for (const item of asArray(node.mainEntity as Record<string, unknown>[])) {
      if (!item || typeof item !== 'object') continue;
      const q = clean(item.name, 200);
      const accepted = item.acceptedAnswer as Record<string, unknown> | undefined;
      const a = clean(accepted?.text, 500);
      if (q && a) out.push({ q, a });
    }
  }
  const re = /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const q = clean(m[1], 200);
    const a = clean(m[2], 500);
    if (q && a) out.push({ q, a });
  }
  const seen = new Set<string>();
  return out.filter((f) => (seen.has(f.q) ? false : (seen.add(f.q), true))).slice(0, 10);
}

/** Merge what one page says into the profile; earlier (home page) values win. */
export function extractSiteProfile(html: string, url: string, base: SiteProfile = emptySiteProfile()): SiteProfile {
  const profile: SiteProfile = { ...base, services: [...base.services], faqs: [...base.faqs], sources: [...base.sources, url] };
  const nodes = jsonLdNodes(html);
  const business = nodes.find((n) => types(n).some((t) => BUSINESS_TYPES.test(t)) && typeof n.name === 'string');
  const text = htmlToText(html);

  if (business) {
    profile.businessName ||= clean(business.name, 120);
    profile.phone ||= clean(business.telephone, 40);
    profile.email ||= clean(business.email, 120).replace(/^mailto:/i, '');
    profile.address ||= addressText(business.address);
    profile.hours ||= hoursFromSchema(business);
    profile.serviceArea ||= areaText(business.areaServed);
    profile.description ||= clean(business.description, 400);
  }
  profile.businessName ||= meta(html, 'og:site_name') || htmlTitle(html).split(/\s[|–—-]\s/)[0].trim().slice(0, 120);
  profile.description ||= meta(html, 'description') || meta(html, 'og:description');
  profile.phone ||= phoneFromText(text);
  profile.hours ||= hoursFromText(text);
  if (!profile.serviceArea) {
    const area = text.match(/(?:serving|service area[s]?:?|proudly serving)\s+([A-Z][^.!?]{3,140})/);
    if (area) profile.serviceArea = area[1].trim();
  }

  for (const s of servicesFromHtml(html)) if (!profile.services.some((x) => x.toLowerCase() === s.toLowerCase())) profile.services.push(s);
  profile.services = profile.services.slice(0, 12);
  for (const f of faqsFromHtml(html, nodes)) if (!profile.faqs.some((x) => x.q === f.q)) profile.faqs.push(f);
  profile.faqs = profile.faqs.slice(0, 10);
  return profile;
}

/** Same-site links worth a second fetch: services, about, contact, FAQ. */
export function profileLinks(html: string, baseUrl: string, limit = 3): string[] {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }
  const out: string[] = [];
  const re = /<a[^>]+href=["']([^"'#]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 40) {
    try {
      const u = new URL(m[1], base);
      if (u.hostname !== base.hostname || !/^https?:$/.test(u.protocol)) continue;
      if (!/\/(services?|about(-us)?|contact(-us)?|faqs?|hours)\/?$/i.test(u.pathname)) continue;
      u.hash = '';
      if (!out.includes(u.toString()) && u.toString() !== base.toString()) out.push(u.toString());
    } catch {
      // skip bad href
    }
  }
  return out.slice(0, limit);
}

/** Text for the onboarding "Services" box: service list, area, and FAQ answers Ava can repeat. */
export function servicesDraft(profile: SiteProfile): string {
  const lines: string[] = [];
  if (profile.services.length) lines.push(`Services: ${profile.services.join(', ')}.`);
  if (profile.serviceArea) lines.push(`Service area: ${profile.serviceArea}.`);
  if (profile.address) lines.push(`Address: ${profile.address}.`);
  if (!profile.services.length && profile.description) lines.push(profile.description);
  if (profile.faqs.length) {
    lines.push('', 'Answers from your website (edit or delete any Ava should not say):');
    for (const f of profile.faqs) lines.push(`Q: ${f.q}`, `A: ${f.a}`);
  }
  return lines.join('\n').trim().slice(0, 4000);
}
