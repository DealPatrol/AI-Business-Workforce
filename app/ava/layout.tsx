import '../receptionist-demo/receptionist.css';
import '../receptionist-demo/sales-upgrade.css';
import '../receptionist-demo/text-preview.css';
import './ava-extras.css';
import './ava-redesign.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AvaViewContent } from '@/components/analytics/AvaViewContent';

export const metadata: Metadata = {
  title: 'Executive Receptionist AI Receptionist for Home Service Businesses',
  description:
    'Executive Receptionist answers missed and after-hours calls for HVAC, plumbing, electrical, roofing, and other home-service shops, qualifies the lead, and texts you. Self-serve plans from $77/month with a free 7-day trial.',
  alternates: { canonical: '/ava' },
  openGraph: {
    title: 'Executive Receptionist AI Receptionist for Home Service Businesses',
    description:
      'Turn missed and after-hours calls into qualified leads. Executive Receptionist answers 24/7, captures job details, and texts your phone. Plans from $77/month.',
    url: '/ava',
    siteName: 'Executive Receptionist',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Executive Receptionist AI Receptionist for Home Service Businesses',
    description: 'Self-serve plans from $77/month. Built for contractors and home-service businesses.',
  },
};

export default function AvaLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AvaViewContent />
      {children}
    </>
  );
}
