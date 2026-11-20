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
      description: plan.firstMonthLabel ? `${plan.description} ${AVA_OFFER.starterIntro}` : plan.description,
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
    logo: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/brand-logo.png`,
    email: AVA_OFFER.contactEmail,
    telephone: TELEPHONE,
    address: BUSINESS_ADDRESS,
    founder: FOUNDER,
    brand: BRANDS,
    description:
      'Executive Receptionist is an AI phone receptionist, named Ava, for HVAC, plumbing, and other small businesses. Four monthly plans from $79 (Starter first month $1) to $789.',
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
