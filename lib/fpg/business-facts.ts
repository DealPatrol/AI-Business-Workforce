/**
 * Free AI business facts generator (frontporchgrowth.com/free-tools/ai-business-facts-generator).
 * Builds three things from what the owner types, in the browser: an answer-first "business in brief"
 * paragraph, LocalBusiness JSON-LD, and a starter llms.txt. Nothing is invented: empty fields are left
 * out of the JSON-LD and shown as [placeholders] in the text.
 */
export const BUSINESS_FACTS_PATH = '/free-tools/ai-business-facts-generator';

/** schema.org LocalBusiness subtypes that exist on schema.org (checked Nov 27, 2026). */
export const SCHEMA_TYPES: Array<{ type: string; label: string; noun: string }> = [
  { type: 'HVACBusiness', label: 'HVAC (heating and air)', noun: 'an HVAC company' },
  { type: 'Plumber', label: 'Plumbing', noun: 'a plumbing company' },
  { type: 'Electrician', label: 'Electrical', noun: 'an electrical contractor' },
  { type: 'RoofingContractor', label: 'Roofing', noun: 'a roofing company' },
  { type: 'GeneralContractor', label: 'General contractor', noun: 'a general contractor' },
  { type: 'HousePainter', label: 'Painting', noun: 'a painting company' },
  { type: 'Locksmith', label: 'Locksmith', noun: 'a locksmith' },
  { type: 'HomeAndConstructionBusiness', label: 'Other home service (landscaping, cleaning, pest control…)', noun: 'a home service business' },
  { type: 'Dentist', label: 'Dentist', noun: 'a dental practice' },
  { type: 'Attorney', label: 'Law firm', noun: 'a law firm' },
  { type: 'LocalBusiness', label: 'Other local business', noun: 'a local business' },
];

export type BusinessFactsInput = {
  name: string;
  schemaType: string;
  website: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  towns: string;
  services: string;
  hours: string;
  founded: string;
  license: string;
  profiles: string;
};

const lines = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((v) => v.trim())
    .filter(Boolean);

function listText(items: string[]) {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function normalizeUrl(value: string) {
  const v = value.trim();
  if (!v) return '';
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const url = new URL(withScheme);
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function e164(value: string) {
  const d = value.replace(/\D/g, '');
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  return '';
}

export function buildBusinessFacts(input: BusinessFactsInput) {
  const name = input.name.trim() || '[Business name]';
  const noun = SCHEMA_TYPES.find((t) => t.type === input.schemaType)?.noun ?? 'a local business';
  const city = input.city.trim();
  const state = input.state.trim();
  const where = city ? `${city}${state ? `, ${state}` : ''}` : '[city, state]';
  const towns = lines(input.towns);
  const services = lines(input.services);
  const profiles = lines(input.profiles).map(normalizeUrl).filter(Boolean);
  const website = normalizeUrl(input.website);
  const phone = input.phone.trim();

  const brief = [
    `${name} is ${noun} based in ${where}.`,
    services.length ? `It offers ${listText(services)}.` : 'It offers [your main services].',
    towns.length ? `It serves ${listText(towns)}.` : 'It serves [the towns you serve].',
    input.hours.trim() ? `Hours: ${input.hours.trim()}.` : '',
    input.founded.trim() ? `In business since ${input.founded.trim()}.` : '',
    input.license.trim() ? `License: ${input.license.trim()}.` : '',
    phone ? `Phone: ${phone}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPES.some((t) => t.type === input.schemaType) ? input.schemaType : 'LocalBusiness',
    name,
    description: brief,
  };
  if (website) {
    jsonLd['@id'] = `${website}/#business`;
    jsonLd.url = website;
  }
  const tel = e164(phone);
  if (tel) jsonLd.telephone = tel;
  if (city || input.street.trim() || input.zip.trim()) {
    const address: Record<string, string> = { '@type': 'PostalAddress' };
    if (input.street.trim()) address.streetAddress = input.street.trim();
    if (city) address.addressLocality = city;
    if (state) address.addressRegion = state;
    if (input.zip.trim()) address.postalCode = input.zip.trim();
    address.addressCountry = 'US';
    jsonLd.address = address;
  }
  if (towns.length) jsonLd.areaServed = towns.map((town) => ({ '@type': 'City', name: town }));
  if (services.length) {
    jsonLd.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: services.map((service) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: service } })),
    };
  }
  if (input.founded.trim()) jsonLd.foundingDate = input.founded.trim();
  if (profiles.length) jsonLd.sameAs = profiles;

  const site = website || '[https://your-site.com]';
  const llms = [
    `# ${name}`,
    '',
    `> ${brief}`,
    '',
    '## Key pages',
    `- Home: ${site}/`,
    ...services.map((service) => `- ${service}: ${site}/[page-for-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}]`),
    `- Contact: ${site}/contact`,
    '',
    '## Facts',
    `- Based in: ${where}`,
    towns.length ? `- Service area: ${towns.join(', ')}` : '- Service area: [towns you serve]',
    phone ? `- Phone: ${phone}` : '- Phone: [phone]',
    input.hours.trim() ? `- Hours: ${input.hours.trim()}` : '',
    input.license.trim() ? `- License: ${input.license.trim()}` : '',
    ...(profiles.length ? ['', '## Profiles', ...profiles.map((p) => `- ${p}`)] : []),
    '',
  ]
    .filter((line, i, all) => !(line === '' && all[i - 1] === ''))
    .filter((line) => line !== null)
    .join('\n');

  return { brief, jsonLd, jsonLdText: `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`, llms };
}

export const BUSINESS_FACTS_FAQS = [
  {
    q: 'What does this generator make?',
    a: 'Three things from the details you type: a short “business in brief” paragraph for your About or home page, LocalBusiness schema (JSON-LD) to paste into your site’s head, and a starter llms.txt file. Empty fields are left out; nothing is made up.',
  },
  {
    q: 'Will this get my business named in ChatGPT or Google AI Overviews?',
    a: 'No tool can promise that. Google says there are no extra requirements for AI Overviews or AI Mode: no AI text files and no special schema. What it does ask for is plain SEO: crawlable pages, important facts in text, structured data that matches the visible page, and an up-to-date Business Profile. This generator helps with the last three by giving you one set of facts to use everywhere.',
  },
  {
    q: 'Do I need an llms.txt file?',
    a: 'Not for Google: its AI features guide says you do not need AI text files. llms.txt is a proposal (llmstxt.org) for a plain summary at your-site.com/llms.txt that some AI tools and developers read. It is a small optional extra; the “business in brief” paragraph on a real page matters more.',
  },
  {
    q: 'Where do I paste the JSON-LD?',
    a: 'In the <head> or body of your home page, or in your site builder’s “custom code” or header-scripts setting. Put the same facts in visible text on that page, since Google asks that structured data match what visitors see. Then test it with the Schema Markup Validator.',
  },
  {
    q: 'Does this tool save what I type?',
    a: 'No. It runs in your browser and nothing is sent unless you choose to request a Gap Report below.',
  },
];

export const BUSINESS_FACTS_SOURCES = [
  { label: 'Google Search Central, “AI features and your website” (read Nov 27, 2026)', url: 'https://developers.google.com/search/docs/appearance/ai-features' },
  { label: 'Google Search Central, LocalBusiness structured data', url: 'https://developers.google.com/search/docs/appearance/structured-data/local-business' },
  { label: 'llmstxt.org, the llms.txt proposal', url: 'https://llmstxt.org/' },
  { label: 'Schema Markup Validator', url: 'https://validator.schema.org/' },
];
