import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReceptionistLanding } from '@/components/receptionist/ReceptionistLanding';
import { ER_DEMO_NICHES, getErDemoNiche, isErDemoSlug } from '@/lib/er-demos';
import { EXECUTIVE_RECEPTIONIST_ORIGIN } from '@/lib/site-url';

type Params = { industry: string };

export function generateStaticParams() {
  return ER_DEMO_NICHES.map((niche) => ({ industry: niche.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { industry } = await params;
  const niche = getErDemoNiche(industry);
  if (!niche) return {};
  const title = `AI Receptionist for ${niche.name} Shops`;
  const description = `Hear a sample ${niche.name} call, then talk to a demo receptionist in your browser. Free 14-day pilot, then $25 per booked job, max $297/mo.`;
  const url = `${EXECUTIVE_RECEPTIONIST_ORIGIN}/receptionist/${niche.slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Executive Receptionist',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ReceptionistIndustryPage({ params }: { params: Promise<Params> }) {
  const { industry } = await params;
  if (!isErDemoSlug(industry)) notFound();
  const niche = getErDemoNiche(industry);
  if (!niche) notFound();
  return <ReceptionistLanding niche={niche} />;
}
