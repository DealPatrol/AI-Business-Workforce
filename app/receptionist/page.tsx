import type { Metadata } from 'next';
import { ReceptionistLanding } from '@/components/receptionist/ReceptionistLanding';
import { avaOfferNodes } from '@/lib/ava/structured-data';
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
      'AI phone receptionist that answers calls, takes the caller name, number and reason, and emails the lead to the business. Texting is available after setup.',
    brand: { '@type': 'Brand', name: 'Front Porch Growth' },
    url: canonical,
    // One Offer per published plan, from the same constants as the pricing page.
    offers: avaOfferNodes(`${EXECUTIVE_RECEPTIONIST_ORIGIN}/pricing`),
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
    openGraph: { images: ['/og-default.png'],
      title,
      description,
      url: canonical,
      siteName: 'Executive Receptionist',
      type: 'website',
    },
    twitter: { images: ['/og-default.png'], card: 'summary_large_image', title, description },
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
