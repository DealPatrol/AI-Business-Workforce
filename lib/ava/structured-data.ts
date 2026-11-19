import { AVA_OFFER, AVA_PLAN_KEYS, AVA_PLANS } from '@/lib/ava/pricing';
import { absoluteSiteUrl } from '@/lib/site-url';

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

const BUSINESS_ADDRESS = {
  '@type': 'PostalAddress' as const,
  streetAddress: '12476 County Road 747',
  addressLocality: 'Hanceville',
  addressRegion: 'AL',
  postalCode: '35077',
  addressCountry: 'US',
};

/** Parent company. Cole Collins DBA Executive Receptionist, same address as the legal pages. */
export function frontPorchOrganization() {
  return {
    '@type': 'Organization',
    '@id': `${absoluteSiteUrl('/')}#org`,
    name: 'Front Porch Growth',
    legalName: 'Cole Collins DBA Executive Receptionist',
    url: absoluteSiteUrl('/'),
    logo: absoluteSiteUrl('/brand-logo.png'),
    email: AVA_OFFER.contactEmail,
    telephone: AVA_OFFER.contactPhoneHref.replace('tel:', ''),
    address: BUSINESS_ADDRESS,
  };
}

/** LocalBusiness + Organization, for search and AI assistants that read NAP and service area. */
export function frontPorchLocalBusiness(extraAreaServed: Array<{ '@type': string; name: string }> = []) {
  const areaServed = [
    ...extraAreaServed,
    { '@type': 'State', name: 'Alabama' },
    { '@type': 'Country', name: 'United States' },
  ];
  return {
    ...frontPorchOrganization(),
    '@type': ['Organization', 'LocalBusiness', 'ProfessionalService'],
    '@id': `${absoluteSiteUrl('/')}#org`,
    description:
      'Executive Receptionist is an AI phone receptionist for HVAC, plumbing, and other small businesses. Front Porch Growth also sells YardMailer postcard campaigns.',
    areaServed,
    makesOffer: avaOfferNodes(absoluteSiteUrl('/pricing')),
  };
}

export function avaOrganization() {
  return {
    '@type': 'Organization',
    name: 'Executive Receptionist',
    url: absoluteSiteUrl('/'),
    parentOrganization: { '@id': `${absoluteSiteUrl('/')}#org` },
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
