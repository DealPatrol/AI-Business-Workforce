import '../receptionist-demo/receptionist.css';
import '../receptionist-demo/sales-upgrade.css';
import '../receptionist-demo/text-preview.css';
import './ava-extras.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AvaViewContent } from '@/components/analytics/AvaViewContent';
import { AVA_PLANS } from '@/lib/ava/pricing';

export const metadata: Metadata = {
  title: 'Ava AI Receptionist for Home Service Businesses',
  description:
    'Ava answers missed and after-hours calls for HVAC, plumbing, electrical, roofing, and other home-service shops, qualifies the lead, and texts you. Self-serve plans from $79/month with a free 7-day trial.',
  alternates: { canonical: '/ava' },
  openGraph: {
    title: 'Ava AI Receptionist for Home Service Businesses',
    description:
      'Turn missed and after-hours calls into qualified leads. Ava answers 24/7, captures job details, and texts your phone. Plans from $79/month.',
    url: '/ava',
    siteName: 'Ava',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ava AI Receptionist for Home Service Businesses',
    description: 'Self-serve plans from $79/month. Built for contractors and home-service businesses.',
  },
};

export default function AvaLayout({ children }: { children: ReactNode }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Ava AI Receptionist',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'AI receptionist for home-service businesses that answers calls, qualifies leads, captures job details and routes follow-up.',
    offers: [
      { '@type': 'Offer', name: AVA_PLANS.starter.label, price: '79', priceCurrency: 'USD' },
      { '@type': 'Offer', name: AVA_PLANS.growth.label, price: '149', priceCurrency: 'USD' },
      { '@type': 'Offer', name: AVA_PLANS.pro.label, price: '299', priceCurrency: 'USD' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <AvaViewContent />
      {children}
    </>
  );
}
