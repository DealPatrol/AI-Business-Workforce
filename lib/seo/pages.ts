export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 155;
export const BRAND_SUFFIX = ' | Front Porch Growth';
export const ROOT_TITLE = 'Front Porch Growth';
export const AI_RECEPTIONIST = 'AI Receptionist';

export const ROOT_DESCRIPTION =
  'Phone answering and postcard marketing for home-service businesses. An AI Receptionist takes the job and sends you the lead, built by a lawn care owner.';

export type SeoSpec = {
  title: string;
  description: string;
  titleMode: 'absolute' | 'template';
  receptionist: boolean;
};

export const ROOT_SEO: SeoSpec = {
  title: ROOT_TITLE,
  description: ROOT_DESCRIPTION,
  titleMode: 'absolute',
  receptionist: false,
};

const PAGES = {
  '/': {
    title: 'Local Growth & AI Search for Trades | Front Porch Growth',
    description:
      'AI search visibility for Alabama trades, YardMailer postcards, Google profile setup, and a free AI visibility grader. From Hanceville, AL.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/start': {
    title: 'Ava AI Receptionist: Home Services and Online Stores',
    description:
      'Ava answers calls for home-service shops and online stores, handles routine questions, and passes the rest to you. From $25/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/desk': {
    title: 'Your desk',
    description: 'Ava’s calls and leads, quick decisions, and every Front Porch Growth tool in one place.',
    titleMode: 'template',
    receptionist: false,
  },
  '/ava': {
    title: 'AI Receptionist for Home Services, Plans from $25/mo',
    description:
      'AI Receptionist for HVAC and plumbing. It takes the job details and emails you a summary. From $25/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/receptionist': {
    title: 'AI Receptionist for HVAC and Plumbing',
    description:
      'AI Receptionist for HVAC and plumbing. It answers 24/7, takes the job details, and emails you a summary. From $25/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/receptionist/packages': {
    title: 'AI Receptionist + Google Profile Packages, From $25/mo',
    description:
      'Ava AI receptionist plans from $25/mo, Google Business Profile care from $99/mo, and bundles from $159/mo with setup included. Alabama trades and beyond.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/receptionist/book-a-demo': {
    title: 'Book an AI Receptionist Demo | Executive Receptionist',
    description:
      'Find your Ava plan in 30 seconds with your own call numbers, then book a free 15-minute demo with Cole Collins. No card needed.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/receptionist-demo': {
    title: 'Try the AI Receptionist Demo',
    description:
      'Hear a prerecorded AI Receptionist call or talk in the browser, then pick a plan. Starter’s first month is $1, then $79 a month.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/hvac': {
    title: 'AI Receptionist for HVAC Companies | Executive Receptionist',
    description:
      'Ava answers HVAC calls 24/7: no heat, no AC, after-hours emergencies, and emails you every lead. From $25/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/gadsden': {
    title: 'AI Receptionist + Google Profile for Gadsden Trades',
    description:
      'Ava answers your calls 24/7 and we run your Google profile: 3 posts a week, review replies, AI search checks. For Gadsden-area trades, month to month.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/business': {
    title: 'AI Receptionist for Any Business | Executive Receptionist',
    description:
      'Ava answers every call 24/7, takes the name, number and reason, flags urgent calls, and emails you. From $25/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/dental': {
    title: 'AI Receptionist for Dental Offices | Executive Receptionist',
    description:
      'Ava answers the calls your front desk misses, flags patients in pain as urgent, and emails you every call. From $25/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/law': {
    title: 'AI Receptionist for Law Firms | Executive Receptionist',
    description:
      'Ava answers while you are in court, takes the name, number and matter, flags urgent calls, and emails you. From $25/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/salon': {
    title: 'AI Receptionist for Salons | Executive Receptionist',
    description:
      'Ava answers while your hands are full, takes the name, number and service wanted, and emails you. From $25/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/auto-repair': {
    title: 'AI Receptionist for Auto Repair Shops',
    description:
      'Ava answers while you are in the bays, takes the vehicle and the problem, flags breakdowns, and emails you. From $25/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/med-spa': {
    title: 'AI Receptionist for Med Spas | Executive Receptionist',
    description:
      'Ava answers consult and pricing calls while you are with clients, flags urgent ones, and emails you. From $25/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/real-estate': {
    title: 'AI Receptionist for Real Estate Agents',
    description:
      'Ava answers buyer and seller calls while you are at a showing, flags urgent ones, and emails you every call. From $25/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/pricing': {
    title: 'AI Receptionist & Postcard Pricing | Front Porch Growth',
    description:
      'AI receptionist plans from $25 to $789 a month (Starter’s first month $1), plus YardMailer postcards: $127 setup, then $3.54 a card.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/compare': {
    title: 'Home-Service Software Prices: ServiceTitan, Jobber, Smith.ai',
    description:
      'Published starting prices for ServiceTitan, Jobber, Housecall Pro, Podium, Smith.ai, Ruby, and Front Porch Growth, with sources and the check date.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/reputation': {
    title: 'ReputationFlow review requests | Front Porch Growth',
    description:
      'ReputationFlow requests reviews and drafts replies. The free QR tool is on tryreputationflow.com. Professional is $20 a month.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/lead-scout': {
    title: 'Lead Scout | Find local businesses without emailing them',
    description:
      'Search public Google listings by trade and city. Lead Scout shows the name, address, phone, and map link. It does not email or text anyone.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/leads': {
    title: '1,000 Business Leads Across the South for $20',
    description:
      '1,000 businesses in the industry you sell to, each with its website and the email it publishes. Across 12 Southern states. CSV, one-time $20.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/leads/hot': {
    title: 'Hot Leads: 500 Business Leads for $20',
    description:
      '500 business leads for $20. Instant CSV download: name, website, city, state, and email where available. No phone numbers.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/leads/thanks': {
    title: 'Thanks for your order',
    description: 'Your lead list order is in. Add a second 1,000-lead list for $15.',
    titleMode: 'template',
    receptionist: false,
  },
  '/leads/more': {
    title: 'Turn your lead list into replies',
    description: 'A cold email sequence for your industry, monthly fresh leads, or done-for-you outreach.',
    titleMode: 'template',
    receptionist: false,
  },
  '/leads/hot/thanks': {
    title: 'Thanks for your order',
    description: 'Your Hot Leads order is in. Download the 500-lead CSV on this page.',
    titleMode: 'template',
    receptionist: false,
  },
  '/agents': {
    title: 'AI agents for home-service shops | Front Porch Growth',
    description:
      'Draft an estimate, a review reply, a job ad, a follow-up text, a service-area page, or an invoice reminder. The drafts stay on the page. Nothing is sent.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/terms': {
    title: 'Terms | Front Porch Growth',
    description:
      'Terms for Front Porch Growth: YardMailer postcards at $127 setup plus per card, Executive Receptionist plans, Lead Finder, and the invoicing waitlist.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/missed-call': {
    title: 'Missed-Call Text-Back waitlist | Front Porch Growth',
    description:
      'Waitlist for missed-call callback texts from Executive Receptionist, sent on behalf of your business after carrier verification.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/sms': {
    title: 'SMS terms | Front Porch Growth',
    description:
      'Executive Receptionist missed-call callback texts: who receives them, frequency, STOP and HELP, and how mobile numbers are handled.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/sms-consent': {
    title: 'SMS consent | Executive Receptionist',
    description:
      'How Executive Receptionist gets consent before texting: Ava’s verbal script on calls and the written checkbox opt-in on the website form.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/blog': {
    title: 'Blog: Calls, Search, and AI Answers for Local Shops',
    description:
      'Plain guides for home-service owners: after-hours calls, AI receptionists, and showing up in Google and ChatGPT answers. No fluff, no ranking promises.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/ai-visibility': {
    title: 'Free SEO & AI Visibility Grader | Front Porch Growth',
    description:
      'See how Google and AI assistants like ChatGPT see your local business. Free grader, real checks, plain-English fixes.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/ai-search-visibility': {
    title: 'AI Search Visibility Agency | Front Porch Growth',
    description:
      'Get named in ChatGPT, Google AI Overviews and Perplexity: trades, dental, med spa, law, B2B. Free Gap Report. From $1,497/mo with a +30% guarantee.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/google-profile/management': {
    title: 'Google Business Profile Management for Trades, $99/mo',
    description:
      'Weekly Google Business Profile management for Alabama trades: posts, hours, review replies and a monthly report. $99 or $179 a month, month to month.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/google-profile': {
    title: 'Google Business Profile setup, $99 | Front Porch Growth',
    description:
      'One-time Google Business Profile setup for local service businesses: categories, services, photos, hours, and a review link. $99.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/privacy': {
    title: 'Privacy | Front Porch Growth',
    description:
      'What we collect: setup details, call and lead data, caller numbers for missed-call callback texts, and ad cookies when tags are on.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/onboarding/ava': {
    title: 'AI Receptionist setup',
    description:
      'Tell us about your business so Executive Receptionist can be set up. It answers calls and emails you the lead. From $25/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/postcards': {
    title: 'YardMailer Postcards | Front Porch Growth',
    description:
      'AI designs each postcard, then it is printed and mailed to the homeowners. $127 setup once, then $3.54 per 4x6 or $4.95 per 6x9.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/checkout': {
    title: 'Checkout',
    description: 'Continue to Stripe checkout. A session starts only after you submit this form.',
    titleMode: 'template',
    receptionist: false,
  },
  '/visual-canvasser': {
    title: 'Visual Canvasser | Front Porch Growth',
    description:
      'See how YardMailer creates managed, human-assisted property-concept postcard campaigns for home-service businesses.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/audit': {
    title: 'Business audit',
    description: ROOT_DESCRIPTION,
    titleMode: 'template',
    receptionist: false,
  },
  '/login': {
    title: 'Customer sign in',
    description: ROOT_DESCRIPTION,
    titleMode: 'template',
    receptionist: false,
  },
  '/dashboard/leads': {
    title: 'Leads',
    description: 'Caller leads captured by Executive Receptionist, plus web forms, texts, and online bookings.',
    titleMode: 'template',
    receptionist: false,
  },
  '/dashboard/leads/[id]': {
    title: 'Lead details',
    description: 'Review one captured lead, add notes, and update its status.',
    titleMode: 'template',
    receptionist: false,
  },
  '/dashboard/bookings': {
    title: 'Booking calendar',
    description: 'Set services, hours, and blackout dates, then share a public page where customers pay a deposit to book.',
    titleMode: 'template',
    receptionist: false,
  },
  '/book/[slug]': {
    title: 'Book an appointment | Front Porch Growth',
    description: 'Pick a service and time, then pay a deposit to confirm the appointment.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/book/[slug]/confirmed': {
    title: 'Booking confirmed | Front Porch Growth',
    description: 'Your deposit was submitted. The business will see the confirmed appointment.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/dashboard/prospector': {
    title: 'Lead Finder',
    description: ROOT_DESCRIPTION,
    titleMode: 'template',
    receptionist: false,
  },
  '/dashboard/prospector/settings': {
    title: 'Lead Finder settings',
    description: ROOT_DESCRIPTION,
    titleMode: 'template',
    receptionist: false,
  },
  '/prospector/unsubscribe': {
    title: 'Unsubscribe',
    description: ROOT_DESCRIPTION,
    titleMode: 'template',
    receptionist: false,
  },
  '/property/[postcode]': {
    title: 'Project Concept Demo | YardMailer',
    description: 'Preview the homeowner-facing destination for a YardMailer property-concept postcard campaign.',
    titleMode: 'template',
    receptionist: false,
  },
  '/property-demo': {
    title: 'Property & Postcard Demo | YardMailer',
    description: 'Explore a clearly labeled YardMailer property concept, postcard, and homeowner estimate-page demo.',
    titleMode: 'template',
    receptionist: false,
  },
} as const satisfies Record<string, SeoSpec>;

export type StaticSeoPath = keyof typeof PAGES;

export function pageSeo(path: StaticSeoPath): SeoSpec {
  return PAGES[path];
}

export function renderedTitle(spec: Pick<SeoSpec, 'title' | 'titleMode'>) {
  if (spec.titleMode === 'template') return `${spec.title}${BRAND_SUFFIX}`;
  return spec.title;
}

export function metadataTitle(spec: Pick<SeoSpec, 'title' | 'titleMode'>): string | { absolute: string } {
  return spec.titleMode === 'absolute' ? { absolute: spec.title } : spec.title;
}

export function demoDocumentTitle(companyName: string) {
  const title = `AI Receptionist demo for ${companyName}`;
  if (title.length <= SEO_TITLE_MAX) return title;
  return 'AI Receptionist private demo';
}

export function demoDocumentDescription(companyName: string) {
  const description = `See how an AI Receptionist handles missed calls for ${companyName}.`;
  if (description.length <= SEO_DESCRIPTION_MAX) return description;
  return 'See how an AI Receptionist handles missed calls for this business.';
}

export const PRIVATE_DEMO_SEO: SeoSpec = {
  title: 'Private demo',
  description: ROOT_DESCRIPTION,
  titleMode: 'template',
  receptionist: false,
};

export const DEMO_NOT_FOUND_SEO: SeoSpec = {
  title: 'Demo not found',
  description: ROOT_DESCRIPTION,
  titleMode: 'template',
  receptionist: false,
};

export function staticSeoEntries(): Array<{ path: StaticSeoPath; spec: SeoSpec }> {
  return (Object.keys(PAGES) as StaticSeoPath[]).map((path) => ({ path, spec: PAGES[path] }));
}

export function isStaticSeoPath(path: string): path is StaticSeoPath {
  return Object.prototype.hasOwnProperty.call(PAGES, path);
}

export function agentDocumentTitle(agentTitle: string) {
  return `${agentTitle}${BRAND_SUFFIX}`;
}
