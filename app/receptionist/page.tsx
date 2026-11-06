import type { Metadata } from 'next';
import { ReceptionistLanding } from '@/components/receptionist/ReceptionistLanding';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { EXECUTIVE_FAQS } from '@/lib/executive-receptionist';
import { getErDemoNiche } from '@/lib/er-demos';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { EXECUTIVE_RECEPTIONIST_ORIGIN } from '@/lib/site-url';

const seo = pageSeo('/receptionist');
const title = renderedTitle(seo);
const description = seo.description;
const canonical = `${EXECUTIVE_RECEPTIONIST_ORIGIN}/`;

const structured = [
  {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Executive Receptionist',
    description:
      'AI phone receptionist that answers inbound calls, takes the caller name, number and job, and emails a summary to the business.',
    brand: { '@type': 'Brand', name: 'Front Porch Growth' },
    offers: [
      {
        '@type': 'Offer',
        name: 'Executive Receptionist, $25 per booked job after a free 14-day pilot',
        price: '25.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://executivereceptionist.com/pricing',
        description: AVA_OFFER.summary,
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: EXECUTIVE_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: metadataTitle(seo),
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Executive Receptionist',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
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
      <ReceptionistLanding niche={niche} />
    </>
  );
}
