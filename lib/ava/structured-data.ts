import { AVA_PLANS, type AvaPlanKey } from '@/lib/ava/pricing';
import { absoluteSiteUrl } from '@/lib/site-url';

type Faq = { q: string; a: string };

export function avaOfferNodes(pageUrl: string) {
  return (Object.keys(AVA_PLANS) as AvaPlanKey[]).map((key) => {
    const plan = AVA_PLANS[key];
    return {
      '@type': 'Offer',
      name: plan.productName,
      price: (plan.monthlyCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: pageUrl,
      description: `Free 7-day trial, then ${plan.monthlyLabel} per month. ${plan.minutes} included voice minutes. ${plan.overageLabel}. $0 setup fee.`,
    };
  });
}

export function avaOrganization() {
  return {
    '@type': 'Organization',
    name: 'Ava by Workforce AI',
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
    brand: { '@type': 'Brand', name: 'Ava' },
    url: input.url,
    offers: avaOfferNodes(input.url),
  };
}

export function avaSoftwareNode(input: { description: string; url: string }) {
  return {
    '@type': 'SoftwareApplication',
    name: 'Ava AI Receptionist',
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
