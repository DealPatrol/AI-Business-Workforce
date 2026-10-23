export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 155;
export const BRAND_SUFFIX = ' | Front Porch Growth';
export const ROOT_TITLE = 'Front Porch Growth';
export const AI_RECEPTIONIST = 'AI Receptionist';

export const ROOT_DESCRIPTION =
  'YardMailer postcards and an AI Receptionist for home-service businesses, plus Lead Finder and an invoicing waitlist.';

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
    title: 'Front Porch Growth: Postcards & AI Receptionist',
    description:
      'YardMailer postcards from $3.54 a card and an AI Receptionist with a free 7-day trial, then $77 a month. For home-service businesses.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/ava': {
    title: 'AI Receptionist for Home Service Businesses, from $77',
    description:
      'AI Receptionist for HVAC, plumbing, roofing, and other home-service shops. She takes the job details and texts you. Free 7-day trial, then $77/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/receptionist': {
    title: 'AI Receptionist for Dentists and Law Firms',
    description:
      'AI Receptionist for dentists, law firms, med spas, and advisors. Executive Receptionist answers, takes the details, and texts you the lead.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/receptionist-demo': {
    title: 'Try the AI Receptionist Demo',
    description:
      'Hear a prerecorded AI Receptionist call or talk in the browser, then start a free 7-day trial. Plans are $77, $168, and $324 a month.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/hvac': {
    title: 'AI Receptionist for HVAC Companies',
    description:
      'AI Receptionist answers HVAC calls 24/7, takes no-heat and no-cool details, and texts you. Free 7-day trial, then $77/mo.',
    titleMode: 'absolute',
    receptionist: true,
  },
  '/pricing': {
    title: 'Pricing | Front Porch Growth',
    description:
      'Postcard prices and AI Receptionist plans: $3.54 or $4.95 a card after $127 setup, and $77, $168, or $324 a month after a 7-day trial.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/compare': {
    title: 'Software prices compared | Front Porch Growth',
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
    title: 'Missed-Call Text-Back, $39/month | Front Porch Growth',
    description:
      'When you miss a call, the caller gets a text from your business within seconds, so the job does not go to the next company. $39 a month.',
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
      'What Front Porch Growth collects: setup details, call and lead data, and advertising cookies when measurement tags are turned on.',
    titleMode: 'absolute',
    receptionist: false,
  },
  '/onboarding/ava': {
    title: 'AI Receptionist setup',
    description:
      'Tell us about your business so Executive Receptionist can be set up. The AI Receptionist answers calls and texts you the lead. Trial, then $77/mo.',
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
    title: 'Sign in',
    description: ROOT_DESCRIPTION,
    titleMode: 'template',
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
