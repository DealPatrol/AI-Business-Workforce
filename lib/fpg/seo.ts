import type { Metadata } from 'next';
import { FPG_COMPETITORS } from '@/lib/fpg/competitors';
import { FRONT_PORCH_GROWTH_ORIGIN, absoluteUrl } from '@/lib/site-url';

export type FpgPageSeo = { title: string; description: string };

/** Absolute titles and descriptions for the Quo-pattern pages added to frontporchgrowth.com. */
export const FPG_PAGE_SEO: Record<string, FpgPageSeo> = {
  '/trades': {
    title: 'Marketing for Home-Service Trades | Front Porch Growth',
    description:
      'Postcards, Google profile setup, AI search visibility and review requests for landscapers, roofers, plumbers, cleaners and more trades.',
  },
  '/free-tools': {
    title: 'Free Marketing Tools for Local Shops | Front Porch Growth',
    description:
      'Free SEO and AI visibility grader, postcard cost and break-even calculators, Lead Scout and writing agents for home-service shops.',
  },
  '/free-tools/postcard-cost-calculator': {
    title: 'Postcard Mailing Cost Calculator | Front Porch Growth',
    description:
      'Enter a quantity and card size to see the exact YardMailer cost with postage included, next to the USPS EDDM postage line.',
  },
  '/free-tools/postcard-roi-calculator': {
    title: 'Postcard Break-Even Calculator | Front Porch Growth',
    description:
      'How many jobs does a postcard mailing need to win to pay for itself? Enter your card count, job value and margin.',
  },
  ...Object.fromEntries(FPG_COMPETITORS.map((c) => [`/compare/${c.slug}`, { title: c.title, description: c.description }])),
};

export function fpgMetadata(path: string, ogImage = '/og-default.png'): Metadata {
  const seo = FPG_PAGE_SEO[path];
  if (!seo) throw new Error(`Missing FPG SEO for ${path}`);
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: absoluteUrl(FRONT_PORCH_GROWTH_ORIGIN, path) },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: absoluteUrl(FRONT_PORCH_GROWTH_ORIGIN, path),
      siteName: 'Front Porch Growth',
      type: 'website',
      images: [ogImage],
    },
    twitter: { card: 'summary_large_image', title: seo.title, description: seo.description, images: [ogImage] },
  };
}

export function breadcrumbNode(items: Array<{ name: string; path: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(FRONT_PORCH_GROWTH_ORIGIN, item.path),
    })),
  };
}

/** Quo-pattern pages added to the Front Porch Growth sitemap, in order. */
export const FPG_EXTRA_INDEX_PATHS: string[] = [
  '/trades',
  '/free-tools',
  '/free-tools/postcard-cost-calculator',
  '/free-tools/postcard-roi-calculator',
  ...FPG_COMPETITORS.map((c) => `/compare/${c.slug}`),
];
