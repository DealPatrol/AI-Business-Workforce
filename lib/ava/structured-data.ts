import { AVA_OFFER, AVA_PLAN_KEYS, AVA_PLANS } from '@/lib/ava/pricing';
import { ownedOrganizationNodes } from '@/lib/seo/sister-sites';
import { EXECUTIVE_RECEPTIONIST_ORIGIN, FRONT_PORCH_GROWTH_ORIGIN } from '@/lib/site-url';

type Faq = { q: string; a: string };

/** One Offer per monthly plan. Starter's $1 first month is a once-only discount, so the listed price is the monthly price. */
export function avaOfferNodes(pageUrl: string) {
  return AVA_PLAN_KEYS.map((key) => {
    const plan = AVA_PLANS[key];
    return {
      '@type': 'Offer',
      name: `Executive Receptionist - ${plan.label} (${plan.minutesLabel}/month)`,
      price: (plan.monthlyCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: pageUrl,
      description: plan.firstMonthLabel
        ? `${plan.description} ${AVA_OFFER.starterIntro}`
        : plan.overageLabel
          ? `${plan.description} ${plan.minutesLabel} included, ${plan.overageLabel}.`
          : plan.description,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: (plan.monthlyCents / 100).toFixed(2),
        priceCurrency: 'USD',
        unitText: 'month',
      },
    };
  });
}

export const avaPlanOfferNodes = avaOfferNodes;

/** City only. The street address stays on the legal pages, not in brand data. */
const BUSINESS_ADDRESS = {
  '@type': 'PostalAddress' as const,
  addressLocality: 'Hanceville',
  addressRegion: 'AL',
  addressCountry: 'US',
};

const LEGAL_NAME = 'Cole Collins DBA Executive Receptionist';
const ER_ORG_ID = `${EXECUTIVE_RECEPTIONIST_ORIGIN}/#org`;
const FOUNDER = {
  '@type': 'Person' as const,
  '@id': `${FRONT_PORCH_GROWTH_ORIGIN}/#cole`,
  name: 'Cole Collins',
  jobTitle: 'Founder',
  address: BUSINESS_ADDRESS,
  url: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/about`,
  owns: ownedOrganizationNodes(),
};
const TELEPHONE = AVA_OFFER.contactPhoneHref.replace('tel:', '');

/** Brands Cole runs. Executive Receptionist (the receptionist is named Ava), Front Porch Growth (marketing), YardMailer (postcards). */
const BRANDS = [
  { '@type': 'Brand', name: 'Executive Receptionist', url: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/` },
  { '@type': 'Brand', name: 'Front Porch Growth', url: `${FRONT_PORCH_GROWTH_ORIGIN}/` },
  { '@type': 'Brand', name: 'YardMailer', url: `${FRONT_PORCH_GROWTH_ORIGIN}/postcards` },
];

/** Front Porch Growth: the marketing-services brand (postcards, Google Profile, free tools). */
export function frontPorchOrganization() {
  return {
    '@type': 'Organization',
    '@id': `${FRONT_PORCH_GROWTH_ORIGIN}/#org`,
    name: 'Front Porch Growth',
    legalName: LEGAL_NAME,
    url: `${FRONT_PORCH_GROWTH_ORIGIN}/`,
    logo: `${FRONT_PORCH_GROWTH_ORIGIN}/brand-logo.png`,
    email: AVA_OFFER.contactEmail,
    telephone: TELEPHONE,
    address: BUSINESS_ADDRESS,
    founder: FOUNDER,
    brand: BRANDS,
  };
}

/** LocalBusiness + Organization for the Front Porch Growth home page. */
export function frontPorchLocalBusiness(extraAreaServed: Array<{ '@type': string; name: string }> = []) {
  const areaServed = [
    ...extraAreaServed,
    { '@type': 'State', name: 'Alabama' },
    { '@type': 'Country', name: 'United States' },
  ];
  return {
    ...frontPorchOrganization(),
    '@type': ['Organization', 'LocalBusiness', 'ProfessionalService'],
    description:
      'Front Porch Growth sells marketing services for home-service businesses: YardMailer postcard campaigns, Google Business Profile setup, and free writing tools. Its sister brand, Executive Receptionist, is an AI phone receptionist named Ava.',
    areaServed,
  };
}

/** Executive Receptionist: the AI receptionist business. Ava is the receptionist. */
export function executiveReceptionistOrganization(extraAreaServed: Array<{ '@type': string; name: string }> = []) {
  return {
    '@type': ['Organization', 'LocalBusiness', 'ProfessionalService'],
    '@id': ER_ORG_ID,
    name: 'Executive Receptionist',
    alternateName: 'Ava by Executive Receptionist',
    legalName: LEGAL_NAME,
    url: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/`,
    logo: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/er/brand-logo.png`,
    email: AVA_OFFER.contactEmail,
    telephone: TELEPHONE,
    address: BUSINESS_ADDRESS,
    founder: FOUNDER,
    brand: BRANDS,
    description:
      'Executive Receptionist is an AI phone receptionist, named Ava, for HVAC, plumbing, and other small businesses. Five monthly plans from $25 (Overflow, 60 minutes) to $789.',
    areaServed: [
      ...extraAreaServed,
      { '@type': 'State', name: 'Alabama' },
      { '@type': 'Country', name: 'United States' },
    ],
    makesOffer: avaOfferNodes(`${EXECUTIVE_RECEPTIONIST_ORIGIN}/pricing`),
  };
}

/** Short reference to the Executive Receptionist organization, for provider fields. */
export function avaOrganization() {
  return {
    '@type': 'Organization',
    '@id': ER_ORG_ID,
    name: 'Executive Receptionist',
    url: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/`,
  };
}

export function faqNode(faqs: Faq[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };
}

export function avaProductNode(input: { name: string; description: string; url: string }) {
  return {
    '@type': 'Product',
    name: input.name,
    description: input.description,
    image: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/er/og-default.png`,
    brand: { '@type': 'Brand', name: 'Executive Receptionist' },
    url: input.url,
    offers: avaOfferNodes(input.url),
  };
}

export function avaSoftwareNode(input: { description: string; url: string }) {
  return {
    '@type': 'SoftwareApplication',
    name: 'Executive Receptionist',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: input.url,
    description: input.description,
    offers: avaOfferNodes(input.url),
    provider: avaOrganization(),
  };
}

export function avaServiceNode(input: {
  name: string;
  description: string;
  url: string;
  audience: string;
  serviceType: string;
  areaServed?: Array<{ '@type': string; name: string }>;
}) {
  return {
    '@type': 'Service',
    name: input.name,
    serviceType: input.serviceType,
    description: input.description,
    url: input.url,
    provider: avaOrganization(),
    areaServed: input.areaServed?.length
      ? input.areaServed
      : { '@type': 'Country', name: 'United States' },
    audience: { '@type': 'BusinessAudience', audienceType: input.audience },
    offers: avaOfferNodes(input.url),
  };
}

export function jsonLdGraph(nodes: object[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}

export function coleCollinsPersonJsonLd() {
  return {
    '@context': 'https://schema.org',
    ...FOUNDER,
  };
}

/** BreadcrumbList for an executivereceptionist.com page. Items are [label, path]. */
export function breadcrumbNode(items: Array<[string, string]>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: `${EXECUTIVE_RECEPTIONIST_ORIGIN}${path === '/' ? '/' : path}`,
    })),
  };
}

/** The setup steps that are true on every plan today. */
export const AVA_SETUP_STEPS = [
  { name: 'Tell us about your shop', text: 'Send your website and notes: services, hours, service area, and what counts as urgent.' },
  { name: 'Forward your line', text: 'Keep your number. Forward every call, or only the ones you miss or cannot take.' },
  { name: 'Every call gets answered', text: 'Ava says she is an AI receptionist, takes the details, and emails you a summary.' },
] as const;

export function howToNode(name: string) {
  return {
    '@type': 'HowTo',
    name,
    step: AVA_SETUP_STEPS.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}
