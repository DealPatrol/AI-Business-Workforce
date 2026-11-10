import { AVA_OFFER } from '@/lib/ava/pricing';
import { AVA_STORE_OFFER } from '@/lib/ava/store-pricing';
import { absoluteSiteUrl } from '@/lib/site-url';

type Faq = { q: string; a: string };

export function avaOfferNodes(pageUrl: string) {
  return [
    {
      '@type': 'Offer',
      name: 'Executive Receptionist - Booked Job',
      price: (AVA_OFFER.perBookedJobCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: pageUrl,
      description: AVA_OFFER.summary,
    },
  ];
}

/** Online-store plan: $119/month + $1 per handled call, free 14-day trial. */
export function avaStoreOfferNode(pageUrl: string) {
  return {
    '@type': 'Offer',
    name: 'Executive Receptionist - Online Store',
    price: (AVA_STORE_OFFER.monthlyCents / 100).toFixed(2),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: pageUrl,
    description: AVA_STORE_OFFER.summary,
    priceSpecification: [
      {
        '@type': 'UnitPriceSpecification',
        price: (AVA_STORE_OFFER.monthlyCents / 100).toFixed(2),
        priceCurrency: 'USD',
        unitText: 'month',
      },
      {
        '@type': 'UnitPriceSpecification',
        price: (AVA_STORE_OFFER.perCallCents / 100).toFixed(2),
        priceCurrency: 'USD',
        unitText: 'call handled',
      },
    ],
  };
}

export function avaOrganization() {
  return {
    '@type': 'Organization',
    name: 'Executive Receptionist by Workforce AI',
    url: absoluteSiteUrl('/'),
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
}) {
  return {
    '@type': 'Service',
    name: input.name,
    serviceType: input.serviceType,
    description: input.description,
    url: input.url,
    provider: avaOrganization(),
    areaServed: { '@type': 'Country', name: 'United States' },
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
