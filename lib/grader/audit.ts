import { PublicFetchError } from '@/lib/prospector/errors';
import { graderFetch, type GraderFetchResult } from '@/lib/grader/fetch';
import {
  collapse,
  elementTexts,
  jsonLdNodes,
  linkRel,
  metaBy,
  tags,
  titleOf,
  typesOf,
  visibleText,
} from '@/lib/grader/html';
import { tradeNoun, tradeTerms } from '@/lib/grader/trades';

export type CheckStatus = 'pass' | 'warn' | 'fail';
export type CheckGroup = 'facts' | 'search' | 'ai' | 'technical';

export type GraderCheck = {
  id: string;
  group: CheckGroup;
  label: string;
  status: CheckStatus;
  weight: number;
  /** What we actually found, in plain words. */
  found: string;
  /** What to do about it. Empty when the check passed. */
  fix: string;
  items?: Array<{ label: string; ok: boolean }>;
};

export type BusinessFacts = {
  name: string | null;
  phones: string[];
  address: string | null;
  email: string | null;
  hours: boolean;
  socials: string[];
  schemaTypes: string[];
};

export type GraderReport = {
  version: 1;
  checkedAt: string;
  input: { website: string; trade: string; city: string };
  finalUrl: string;
  score: number;
  grade: 'Strong' | 'Fair' | 'Needs work';
  checks: GraderCheck[];
  fixes: Array<{ id: string; label: string; fix: string; weight: number }>;
  facts: BusinessFacts;
  page: { title: string; htmlKb: number; responseMs: number; scripts: number; images: number; truncated: boolean };
  method: string[];
};

const LOCAL_BUSINESS_TYPES = new Set(
  [
    'LocalBusiness',
    'HomeAndConstructionBusiness',
    'HVACBusiness',
    'Plumber',
    'Electrician',
    'RoofingContractor',
    'GeneralContractor',
    'HousePainter',
    'Locksmith',
    'MovingCompany',
    'ProfessionalService',
    'HomeGoodsStore',
    'AutomotiveBusiness',
    'CleaningService',
    'LandscapingBusiness',
    'PestControl',
    'EmergencyService',
    'Store',
    'Organization',
  ].map((type) => type.toLowerCase()),
);

const SEARCH_BOTS = ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot'];
const TRAINING_BOTS = ['GPTBot', 'Google-Extended', 'ClaudeBot', 'CCBot', 'Applebot-Extended'];

const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\b[2-9]\d{2}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g;
const STREET_RE =
  /\b\d{2,6}\s+(?:[NSEW]\.?\s+)?[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:St|Street|Ave|Avenue|Rd|Road|Hwy|Highway|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Pkwy|Parkway|Ct|Court|Pl|Place|Cir|Circle|Trl|Trail)\b\.?/;
const CITY_STATE_ZIP_RE = /\b[A-Z][a-zA-Z.' -]{2,30},?\s+(?:A[LKZR]|C[AOT]|D[EC]|FL|GA|HI|I[DLNA]|K[SY]|LA|M[EDAINSOT]|N[EVHJMYCD]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[TA]|W[AVIY])\s+\d{5}\b/;

function escapeRe(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countTerm(haystack: string, term: string) {
  const re = new RegExp(`(^|[^a-z0-9])${escapeRe(term.toLowerCase())}(?=$|[^a-z0-9])`, 'g');
  return (haystack.toLowerCase().match(re) || []).length;
}

function cityName(city: string) {
  return city.split(',')[0].trim();
}

function digits(phone: string) {
  const d = phone.replace(/\D/g, '');
  return d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
}

function formatPhone(d: string) {
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d;
}

function textOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(', ');
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof v.name === 'string') return v.name;
    return [v.streetAddress, v.addressLocality, v.addressRegion, v.postalCode].map(textOf).filter(Boolean).join(', ');
  }
  return '';
}

type RobotsGroup = { agents: string[]; disallow: string[]; allow: string[] };

export function parseRobots(body: string) {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;
  let lastWasAgent = false;
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === 'sitemap') {
      if (value) sitemaps.push(value);
      continue;
    }
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], disallow: [], allow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (key === 'disallow') current.disallow.push(value);
    if (key === 'allow') current.allow.push(value);
  }
  return { groups, sitemaps };
}

export function robotsBlocksRoot(groups: RobotsGroup[], bot: string) {
  const name = bot.toLowerCase();
  const specific = groups.filter((group) => group.agents.some((agent) => agent !== '*' && name.includes(agent)));
  const chosen = specific.length ? specific : groups.filter((group) => group.agents.includes('*'));
  if (!chosen.length) return false;
  const disallowRoot = chosen.some((group) => group.disallow.some((rule) => rule === '/' || rule === '/*'));
  const allowRoot = chosen.some((group) => group.allow.some((rule) => rule === '/' || rule === '/*'));
  return disallowRoot && !allowRoot;
}

function status(ok: boolean, partial = false): CheckStatus {
  if (ok) return 'pass';
  return partial ? 'warn' : 'fail';
}

async function optionalFetch(url: string, accept: string): Promise<GraderFetchResult | null> {
  try {
    return await graderFetch(url, { timeoutMs: 5_000, maxBytes: 300_000, accept });
  } catch {
    return null;
  }
}

export function normalizeWebsite(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) throw new PublicFetchError('Enter your website address.');
  if (trimmed.length > 300) throw new PublicFetchError('That website address is too long.');
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new PublicFetchError('That does not look like a website address.');
  }
  if (!url.hostname.includes('.')) throw new PublicFetchError('That does not look like a website address.');
  return url.toString();
}

export async function runAudit(input: { website: string; trade: string; city: string }): Promise<GraderReport> {
  const website = normalizeWebsite(input.website);
  let page: GraderFetchResult;
  try {
    page = await graderFetch(website, { timeoutMs: 9_000, maxBytes: 1_500_000 });
  } catch (error) {
    // A site that only answers on http still deserves a report.
    if (website.startsWith('https://') && !/^https:\/\//i.test(input.website.trim())) {
      page = await graderFetch(website.replace(/^https:/, 'http:'), { timeoutMs: 7_000, maxBytes: 1_500_000 });
    } else {
      throw error;
    }
  }
  if (page.status >= 400) {
    throw new PublicFetchError(`Your website answered with an error (HTTP ${page.status}), so we could not read it.`);
  }
  if (page.contentType && !/html|xml|text\/plain/.test(page.contentType)) {
    throw new PublicFetchError('That address did not return a web page.');
  }

  const html = page.body;
  const finalUrl = new URL(page.finalUrl);
  const origin = finalUrl.origin;
  const text = visibleText(html);
  const textLower = text.toLowerCase();
  const title = titleOf(html);
  const description = metaBy(html, 'name', 'description');
  const h1s = elementTexts(html, 'h1').filter(Boolean);
  const headings = [...h1s, ...elementTexts(html, 'h2'), ...elementTexts(html, 'h3')];
  const nodes = jsonLdNodes(html);
  const schemaTypes = Array.from(new Set(nodes.flatMap(typesOf)));
  const microdata = (html.match(/itemtype\s*=\s*["']https?:\/\/schema\.org\/([A-Za-z]+)["']/gi) || []).map((m) =>
    m.replace(/.*schema\.org\//i, '').replace(/["']$/, ''),
  );
  const allTypes = Array.from(new Set([...schemaTypes, ...microdata]));
  const businessNode = nodes.find((node) => typesOf(node).some((type) => LOCAL_BUSINESS_TYPES.has(type.toLowerCase()) && type !== 'Organization'));
  const orgNode = businessNode || nodes.find((node) => typesOf(node).includes('Organization'));

  const [robotsRes] = await Promise.all([optionalFetch(`${origin}/robots.txt`, 'text/plain,*/*;q=0.5')]);
  const robotsOk = Boolean(robotsRes && robotsRes.status === 200 && !/<html/i.test(robotsRes.body.slice(0, 500)));
  const robots = robotsOk && robotsRes ? parseRobots(robotsRes.body) : { groups: [], sitemaps: [] };
  const sitemapCandidates = Array.from(new Set([...robots.sitemaps.slice(0, 2), `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`]));
  let sitemapUrl: string | null = null;
  for (const candidate of sitemapCandidates.slice(0, 3)) {
    const res = await optionalFetch(candidate, 'application/xml,text/xml,*/*;q=0.5');
    if (res && res.status === 200 && /<(urlset|sitemapindex)\b/i.test(res.body)) {
      sitemapUrl = res.finalUrl;
      break;
    }
  }

  const checks: GraderCheck[] = [];
  const trade = tradeTerms(input.trade);
  const city = cityName(input.city);
  const noun = tradeNoun(trade.label);

  // ---------- Business facts ----------
  const telLinks = tags(html, 'a')
    .map((a) => a.href || '')
    .filter((href) => /^tel:/i.test(href))
    .map((href) => digits(decodeURIComponent(href.slice(4))));
  const textPhones = (text.match(PHONE_RE) || []).map(digits);
  const schemaPhones = nodes.map((node) => textOf(node.telephone)).filter(Boolean).map(digits);
  const phones = Array.from(new Set([...telLinks, ...schemaPhones, ...textPhones].filter((d) => d.length === 10 && !/^\d{3}55501\d{2}$/.test(d)))).slice(0, 3);
  checks.push({
    id: 'phone',
    group: 'facts',
    label: 'Phone number people (and AI) can find',
    status: status(phones.length > 0 && (telLinks.length > 0 || schemaPhones.length > 0), phones.length > 0),
    weight: 10,
    found: phones.length
      ? `Found ${phones.map(formatPhone).join(', ')}${telLinks.length ? ' with a tap-to-call link' : ', but not as a tap-to-call link'}.`
      : 'No phone number found on the page.',
    fix: phones.length
      ? telLinks.length
        ? ''
        : 'Make your phone number a tap-to-call link (tel:) near the top of the page so mobile visitors can call in one tap.'
      : 'Put your phone number near the top of the page as a tap-to-call link. It is the first thing a homeowner and an AI assistant look for.',
  });

  const schemaAddress = orgNode ? textOf(orgNode.address) : '';
  const streetMatch = text.match(STREET_RE)?.[0] || '';
  const cszMatch = text.match(CITY_STATE_ZIP_RE)?.[0] || '';
  const address = schemaAddress || streetMatch || cszMatch || null;
  checks.push({
    id: 'address',
    group: 'facts',
    label: 'Address or service area spelled out',
    status: status(Boolean(schemaAddress || streetMatch), Boolean(cszMatch)),
    weight: 6,
    found: address ? `Found “${collapse(address).slice(0, 120)}”.` : 'No street address or city/ZIP found.',
    fix:
      schemaAddress || streetMatch
        ? ''
        : 'List your business address, or if you work out of your truck, list the towns you serve. Keep it the same as your Google Business Profile.',
  });

  const cityCount = city ? countTerm(text, city) + countTerm(title, city) : 0;
  const cityInTitle = city ? countTerm(title, city) > 0 || h1s.some((h) => countTerm(h, city) > 0) : false;
  checks.push({
    id: 'city',
    group: 'search',
    label: `Mentions ${city || 'your city'}`,
    status: status(cityCount > 0 && cityInTitle, cityCount > 0),
    weight: 10,
    found: cityCount
      ? `“${city}” appears ${cityCount} time${cityCount === 1 ? '' : 's'}${cityInTitle ? ', including the title or main heading' : ', but not in the title or main heading'}.`
      : `“${city}” does not appear on the page.`,
    fix:
      cityCount && cityInTitle
        ? ''
        : `Say “${city}” in your page title and main heading, and name the nearby towns you serve in plain sentences. Search engines and AI assistants match businesses to places by what the page says.`,
  });

  const tradeHits = trade.terms.map((term) => ({ term, count: countTerm(text, term) + countTerm(title, term) })).filter((t) => t.count > 0);
  const tradeInTitle = trade.terms.some((term) => countTerm(title, term) > 0 || h1s.some((h) => countTerm(h, term) > 0));
  checks.push({
    id: 'trade',
    group: 'search',
    label: 'Says clearly what you do',
    status: status(tradeHits.length > 0 && tradeInTitle, tradeHits.length > 0),
    weight: 10,
    found: tradeHits.length
      ? `Found ${tradeHits
          .slice(0, 4)
          .map((t) => `“${t.term}”`)
          .join(', ')}${tradeInTitle ? ', including in the title or main heading' : ', but not in the title or main heading'}.`
      : `No words for “${trade.label}” found on the page.`,
    fix:
      tradeHits.length && tradeInTitle
        ? ''
        : `Use the words customers use (for example “${trade.terms[0]}”) in your title, main heading, and a short list of services.`,
  });

  const typeList = allTypes.filter((type) => LOCAL_BUSINESS_TYPES.has(type.toLowerCase()));
  const hasLocal = typeList.some((type) => type !== 'Organization');
  checks.push({
    id: 'schema',
    group: 'ai',
    label: 'Business details in structured data (schema)',
    status: status(hasLocal, typeList.length > 0),
    weight: 10,
    found: allTypes.length
      ? `Found schema types: ${allTypes.slice(0, 6).join(', ')}.`
      : 'No structured data (JSON-LD or microdata) found.',
    fix: hasLocal
      ? ''
      : 'Add LocalBusiness schema (or a trade type like HVACBusiness or Plumber) with your name, phone, address or service area, hours, and website. It hands search engines and AI assistants your facts in a format they read reliably.',
  });

  const hoursFound =
    nodes.some((node) => node.openingHours || node.openingHoursSpecification) ||
    /\b(mon(day)?|tue(sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?|sun(day)?)\b[^.]{0,30}\d{1,2}(:\d{2})?\s?(am|pm|a\.m\.|p\.m\.)/i.test(text) ||
    /\b24\/7\b|\b24 hours\b/i.test(text);
  const mailto = tags(html, 'a')
    .map((a) => a.href || '')
    .find((href) => /^mailto:/i.test(href));
  const socials = Array.from(
    new Set(
      tags(html, 'a')
        .map((a) => a.href || '')
        .filter((href) => /facebook\.com|instagram\.com|nextdoor\.com|yelp\.com|google\.com\/maps|g\.page|linkedin\.com|youtube\.com|tiktok\.com/i.test(href))
        .map((href) => {
          try {
            return new URL(href).hostname.replace(/^www\./, '');
          } catch {
            return '';
          }
        })
        .filter(Boolean),
    ),
  ).slice(0, 6);
  checks.push({
    id: 'hours',
    group: 'facts',
    label: 'Business hours listed',
    status: status(hoursFound, false),
    weight: 4,
    found: hoursFound ? 'Found business hours or a 24/7 note.' : 'No business hours found.',
    fix: hoursFound ? '' : 'List your hours (and whether you take emergency calls). People ask AI assistants “who is open now?”',
  });

  // ---------- Search basics ----------
  checks.push({
    id: 'title',
    group: 'search',
    label: 'Page title',
    status: status(title.length >= 15 && title.length <= 65, title.length > 0),
    weight: 8,
    found: title ? `“${title.slice(0, 120)}” (${title.length} characters).` : 'No page title found.',
    fix:
      title.length >= 15 && title.length <= 65
        ? ''
        : title.length > 65
          ? 'Shorten the title to about 50–60 characters so it is not cut off in search results. Lead with what you do and where.'
          : `Write a title like “${trade.label} in ${city || 'Your Town'} | Your Business Name”.`,
  });

  const descLen = description?.length ?? 0;
  checks.push({
    id: 'description',
    group: 'search',
    label: 'Meta description',
    status: status(descLen >= 50 && descLen <= 165, descLen > 0),
    weight: 8,
    found: description ? `“${description.slice(0, 170)}” (${descLen} characters).` : 'No meta description found.',
    fix:
      descLen >= 50 && descLen <= 165
        ? ''
        : descLen > 165
          ? 'Trim the description to about 150 characters so it is not cut off.'
          : 'Add a one or two sentence description: what you do, where, and why to call you. This is often the snippet people read in search results.',
  });

  checks.push({
    id: 'h1',
    group: 'search',
    label: 'One clear main heading (H1)',
    status: status(h1s.length === 1, h1s.length > 1),
    weight: 6,
    found: h1s.length
      ? `${h1s.length} main heading${h1s.length === 1 ? '' : 's'} found: “${h1s[0].slice(0, 100)}”.`
      : 'No main heading (H1) found.',
    fix:
      h1s.length === 1
        ? ''
        : h1s.length > 1
          ? 'Use one H1 for the main message and make the rest H2 or H3 headings.'
          : `Add one main heading that says what you do and where, like “${trade.label} in ${city || 'your town'}”.`,
  });

  const robotsMeta = (metaBy(html, 'name', 'robots') || '').toLowerCase();
  const noindex = /noindex/.test(robotsMeta);
  checks.push({
    id: 'indexable',
    group: 'search',
    label: 'Search engines are allowed to list this page',
    status: noindex ? 'fail' : 'pass',
    weight: 10,
    found: noindex ? `The page tells search engines not to list it (robots: “${robotsMeta}”).` : 'No “noindex” tag found.',
    fix: noindex ? 'Remove the “noindex” robots tag from this page, or search engines will keep it out of results.' : '',
  });

  // ---------- AI readiness ----------
  const faqSchema = allTypes.includes('FAQPage');
  const questionHeadings = headings.filter((h) => h.trim().endsWith('?')).length;
  const summaries = (html.match(/<summary\b/gi) || []).length;
  const faqHeading = headings.some((h) => /\bfaqs?\b|frequently asked|common questions/i.test(h));
  const faqFound = faqSchema || faqHeading || questionHeadings + summaries >= 3;
  checks.push({
    id: 'faq',
    group: 'ai',
    label: 'Frequently asked questions',
    status: status(faqFound && (faqSchema || faqHeading), faqFound),
    weight: 6,
    found: faqSchema
      ? 'Found FAQ structured data.'
      : faqFound
        ? `Found ${faqHeading ? 'an FAQ section' : `${questionHeadings + summaries} question-style headings`}${faqSchema ? '' : ' (no FAQ schema)'}.`
        : 'No FAQ section found.',
    fix: faqSchema
      ? ''
      : faqFound
        ? 'Add FAQPage schema to the questions you already answer so they are easier for search engines and AI to read.'
        : 'Add 4–6 real questions customers ask you (price range, how fast you can come, areas you serve, licensed and insured) with short, direct answers.',
  });

  const answerChecks = [
    { label: 'Prices or price ranges', ok: /\$\s?\d|\bprice|\bpricing|\bcost|\bestimate|\bquote/i.test(text) },
    { label: 'Licensed, insured, or certified', ok: /licen[cs]ed|insured|bonded|certified|nate\b|epa\b/i.test(text) },
    { label: 'Areas you serve', ok: /serv(e|ing|ice area)s?\b[^.]{0,60}\b(county|area|cities|towns|[A-Z][a-z]+,)/i.test(text) || /service area/i.test(text) },
    { label: 'Reviews or what customers say', ok: /review|testimonial|stars?\b|rated|what (our )?customers say/i.test(text) },
    { label: 'How fast you respond or emergency service', ok: /same[- ]day|emergency|24\/7|next[- ]day|within \d+ (hours|minutes)|fast response/i.test(text) },
    { label: 'Years in business or who runs it', ok: /since (19|20)\d{2}|\d+\+? years|family[- ]owned|locally owned|owner|founded/i.test(text) },
  ];
  const answered = answerChecks.filter((item) => item.ok).length;
  checks.push({
    id: 'answers',
    group: 'ai',
    label: `Answers what people ask before hiring a ${noun}`,
    status: status(answered >= 5, answered >= 3),
    weight: 8,
    found: `The page covers ${answered} of ${answerChecks.length} common questions.`,
    fix:
      answered >= 5
        ? ''
        : `Add short, plain answers for: ${answerChecks
            .filter((item) => !item.ok)
            .map((item) => item.label.toLowerCase())
            .join('; ')}. AI assistants tend to recommend businesses whose pages answer these directly.`,
    items: answerChecks,
  });

  const blockedSearch = robotsOk ? SEARCH_BOTS.filter((bot) => robotsBlocksRoot(robots.groups, bot)) : [];
  const blockedTraining = robotsOk ? TRAINING_BOTS.filter((bot) => robotsBlocksRoot(robots.groups, bot)) : [];
  checks.push({
    id: 'crawlers',
    group: 'ai',
    label: 'Search and AI crawlers can read the site',
    status: blockedSearch.length === 0 ? 'pass' : blockedSearch.some((bot) => bot === 'Googlebot' || bot === 'Bingbot') ? 'fail' : 'warn',
    weight: 6,
    found: !robotsOk
      ? 'No robots.txt, so nothing is blocked.'
      : blockedSearch.length
        ? `robots.txt blocks: ${blockedSearch.join(', ')}.`
        : `robots.txt does not block Google, Bing, or the AI search crawlers we check (${SEARCH_BOTS.slice(2).join(', ')}).${blockedTraining.length ? ` It does block AI training crawlers (${blockedTraining.join(', ')}), which is a fair choice and does not stop AI search.` : ''}`,
    fix: blockedSearch.length
      ? `Unblock ${blockedSearch.join(', ')} in robots.txt. Blocking them keeps your site out of their search results and answers.`
      : '',
  });

  // ---------- Technical ----------
  const https = finalUrl.protocol === 'https:';
  checks.push({
    id: 'https',
    group: 'technical',
    label: 'Secure connection (HTTPS)',
    status: https ? 'pass' : 'fail',
    weight: 8,
    found: https ? 'The site loads over HTTPS.' : 'The site loads over plain HTTP.',
    fix: https ? '' : 'Turn on HTTPS (most hosts do it free). Browsers label plain HTTP sites “Not secure”.',
  });

  const viewport = metaBy(html, 'name', 'viewport') || '';
  const mobile = /width\s*=\s*device-width/i.test(viewport);
  checks.push({
    id: 'viewport',
    group: 'technical',
    label: 'Set up for phones (mobile viewport)',
    status: status(mobile, Boolean(viewport)),
    weight: 8,
    found: viewport ? `Viewport tag: “${viewport.slice(0, 80)}”.` : 'No mobile viewport tag found.',
    fix: mobile ? '' : 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> so the page fits phone screens. Most of your visitors are on a phone.',
  });

  checks.push({
    id: 'sitemap',
    group: 'technical',
    label: 'Sitemap',
    status: sitemapUrl ? 'pass' : 'fail',
    weight: 4,
    found: sitemapUrl ? `Found a sitemap at ${sitemapUrl}.` : 'No sitemap found at /sitemap.xml or in robots.txt.',
    fix: sitemapUrl ? '' : 'Add a sitemap.xml (most website builders have a switch for it) and submit it in Google Search Console.',
  });

  checks.push({
    id: 'robots',
    group: 'technical',
    label: 'robots.txt',
    status: robotsOk ? (robots.sitemaps.length ? 'pass' : 'warn') : 'warn',
    weight: 3,
    found: robotsOk
      ? `Found robots.txt${robots.sitemaps.length ? ' with a sitemap line' : ' without a sitemap line'}.`
      : 'No robots.txt found.',
    fix: robotsOk && robots.sitemaps.length ? '' : 'Add a simple robots.txt that allows crawling and points to your sitemap (Sitemap: https://yoursite.com/sitemap.xml).',
  });

  const ogTitle = metaBy(html, 'property', 'og:title');
  const ogDesc = metaBy(html, 'property', 'og:description');
  const ogImage = metaBy(html, 'property', 'og:image');
  const ogCount = [ogTitle, ogDesc, ogImage].filter(Boolean).length;
  checks.push({
    id: 'opengraph',
    group: 'technical',
    label: 'Link preview tags (Open Graph)',
    status: status(ogCount === 3, ogCount > 0),
    weight: 4,
    found: ogCount
      ? `Found ${[ogTitle && 'og:title', ogDesc && 'og:description', ogImage && 'og:image'].filter(Boolean).join(', ')}.`
      : 'No Open Graph tags found.',
    fix: ogCount === 3 ? '' : 'Add og:title, og:description, and og:image so your link shows a proper preview when it is texted or shared on Facebook.',
  });

  const canonical = linkRel(html, 'canonical');
  checks.push({
    id: 'canonical',
    group: 'technical',
    label: 'Canonical link',
    status: canonical ? 'pass' : 'warn',
    weight: 2,
    found: canonical ? `Canonical: ${canonical.slice(0, 120)}.` : 'No canonical link found.',
    fix: canonical ? '' : 'Add a canonical link so search engines know which address is the real one (with or without www).',
  });

  const scripts = (html.match(/<script\b[^>]*\bsrc=/gi) || []).length;
  const images = tags(html, 'img');
  const htmlKb = Math.round(page.bytes / 1024);
  const fast = page.responseMs <= 800 && htmlKb <= 400 && scripts <= 25;
  const okish = page.responseMs <= 2_000 && htmlKb <= 1_200 && scripts <= 45;
  checks.push({
    id: 'speed',
    group: 'technical',
    label: 'Rough page speed',
    status: status(fast, okish),
    weight: 6,
    found: `Server answered in ${page.responseMs} ms. The HTML is ${htmlKb} KB${page.truncated ? '+' : ''} with ${scripts} script file${scripts === 1 ? '' : 's'} and ${images.length} image${images.length === 1 ? '' : 's'}.`,
    fix: fast
      ? ''
      : 'Trim heavy scripts and plugins, compress images, and check your hosting. For a full speed test, run the page through Google PageSpeed Insights.',
  });

  const missingAlt = images.filter((img) => !('alt' in img)).length;
  checks.push({
    id: 'alt',
    group: 'technical',
    label: 'Images have alt text',
    status: images.length === 0 || missingAlt === 0 ? 'pass' : missingAlt / images.length <= 0.25 ? 'warn' : 'fail',
    weight: 3,
    found: images.length ? `${images.length - missingAlt} of ${images.length} images have alt text.` : 'No images on the page.',
    fix: missingAlt ? 'Describe your job photos in alt text (“new Trane heat pump installed in Cullman”). It helps screen readers and image search.' : '',
  });

  // ---------- Score ----------
  const total = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + (check.status === 'pass' ? check.weight : check.status === 'warn' ? check.weight / 2 : 0), 0);
  const score = Math.round((earned / total) * 100);
  const grade = score >= 80 ? 'Strong' : score >= 55 ? 'Fair' : 'Needs work';
  const fixes = checks
    .filter((check) => check.status !== 'pass' && check.fix)
    .sort((a, b) => (b.status === 'fail' ? 1 : 0) - (a.status === 'fail' ? 1 : 0) || b.weight - a.weight)
    .map((check) => ({ id: check.id, label: check.label, fix: check.fix, weight: check.weight }));

  const ogSite = metaBy(html, 'property', 'og:site_name');
  const name = (orgNode && textOf(orgNode.name)) || ogSite || title.split(/\s[|–—-]\s/)[0] || null;

  return {
    version: 1,
    checkedAt: new Date().toISOString(),
    input: { website: input.website.trim(), trade: trade.label, city: input.city.trim() },
    finalUrl: page.finalUrl,
    score,
    grade,
    checks,
    fixes,
    facts: {
      name: name ? collapse(name).slice(0, 120) : null,
      phones: phones.map(formatPhone),
      address: address ? collapse(address).slice(0, 160) : null,
      email: mailto ? decodeURIComponent(mailto.replace(/^mailto:/i, '').split('?')[0]).slice(0, 120) : null,
      hours: hoursFound,
      socials,
      schemaTypes: allTypes.slice(0, 10),
    },
    page: { title, htmlKb, responseMs: page.responseMs, scripts, images: images.length, truncated: page.truncated },
    method: [
      `We loaded ${page.finalUrl} once on ${new Date().toUTCString()} and read its HTML as a search crawler would.`,
      'We also read robots.txt and looked for a sitemap.',
      'Only the page you entered was checked, not your whole site. Speed is a rough server-response and page-size check, not a lab speed test.',
    ],
  };
}
