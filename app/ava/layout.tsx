import '../receptionist-demo/receptionist.css';
import '../receptionist-demo/sales-upgrade.css';
import '../receptionist-demo/text-preview.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'AI Receptionist for Home Service Businesses | Ava by Workforce AI',
  description:
    'Ava answers calls 24/7 for landscapers, HVAC companies, roofers, plumbers, fencing companies and other home-service businesses. Plans start at $59/month with $0 setup.',
  alternates: { canonical: '/ava' },
  openGraph: {
    title: 'Ava AI Receptionist for Home Service Businesses',
    description:
      '24/7 AI receptionist for home-service companies. Qualify leads, capture job details, book appointments and stop losing missed calls.',
    url: '/ava',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ava AI Receptionist for Home Service Businesses',
    description: 'Plans from $59/month. $0 setup. Built for contractors and home-service businesses.',
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
      { '@type': 'Offer', name: 'Starter', price: '59', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Growth', price: '129', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Pro', price: '249', priceCurrency: 'USD' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {children}
    </>
  );
}
