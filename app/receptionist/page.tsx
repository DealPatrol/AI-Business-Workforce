import type { Metadata } from 'next';
import { ErHome } from '@/components/receptionist/home/ErHome';
import { avaPlanOfferNodes, executiveReceptionistOrganization, faqNode } from '@/lib/ava/structured-data';
import { ER_HOME_FAQS } from '@/lib/ava/er-home-content';
import { getErDemoNiche } from '@/lib/er-demos';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { ER_ICON_METADATA, ER_OG_IMAGE, ER_OG_IMAGE_ALT } from '@/lib/er/page-meta';
import { EXECUTIVE_RECEPTIONIST_ORIGIN } from '@/lib/site-url';

const seo = pageSeo('/receptionist');
const title = renderedTitle(seo);
const description = seo.description;
const canonical = `${EXECUTIVE_RECEPTIONIST_ORIGIN}/`;

const structured = {
  '@context': 'https://schema.org',
  '@graph': [
    executiveReceptionistOrganization(),
    {
      '@type': 'WebSite',
      name: 'Executive Receptionist',
      url: canonical,
      publisher: { '@id': `${EXECUTIVE_RECEPTIONIST_ORIGIN}/#org` },
    },
    {
      '@type': 'Product',
      name: 'Executive Receptionist',
      description:
        'Ava, the Executive Receptionist AI phone receptionist, answers calls 24/7, takes the caller name, number and reason, and emails the lead to the business. Once hours are set in the Desk, she books visits into the Desk calendar during the call.',
      brand: { '@type': 'Brand', name: 'Executive Receptionist' },
      url: canonical,
      offers: avaPlanOfferNodes(`${EXECUTIVE_RECEPTIONIST_ORIGIN}/pricing`),
    },
    faqNode(ER_HOME_FAQS.map((faq) => ({ q: faq.q, a: faq.a }))),
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: metadataTitle(seo),
    description,
    alternates: { canonical },
    ...ER_ICON_METADATA,
    openGraph: {
      images: [{ url: ER_OG_IMAGE, width: 1200, height: 630, alt: ER_OG_IMAGE_ALT }],
      title,
      description,
      url: canonical,
      siteName: 'Executive Receptionist',
      type: 'website',
    },
    twitter: { images: [ER_OG_IMAGE], card: 'summary_large_image', title, description },
  };
}

export default async function ReceptionistPage({
  searchParams,
}: {
  searchParams?: Promise<{ industry?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const niche = getErDemoNiche(params.industry);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }}
      />
      <ErHome niche={niche} />
    </>
  );
}
