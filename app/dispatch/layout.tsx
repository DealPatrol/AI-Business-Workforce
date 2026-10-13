import '../receptionist-demo/receptionist.css';
import '../receptionist-demo/sales-upgrade.css';
import '../receptionist-demo/text-preview.css';
import './ava-extras.css';
import './ava-redesign.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AvaViewContent } from '@/components/analytics/AvaViewContent';

export const metadata: Metadata = {
  title: 'Front Porch Dispatch | AI receptionist and dispatcher',
  description:
    'Front Porch Dispatch answers missed and after-hours calls for HVAC, plumbing, electrical, roofing, and other home-service shops, qualifies the lead, and texts you so you can dispatch the job. Self-serve plans from $79/month with a free 7-day trial.',
  alternates: { canonical: '/dispatch' },
  openGraph: {
    title: 'Front Porch Dispatch | AI receptionist and dispatcher',
    description:
      'Turn missed and after-hours calls into qualified leads. Front Porch Dispatch answers 24/7, captures job details, and texts your phone so you can dispatch the job. Plans from $79/month.',
    url: '/dispatch',
    siteName: 'Front Porch Dispatch',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Front Porch Dispatch AI Receptionist for Home Service Businesses',
    description: 'Self-serve plans from $79/month. Built for contractors and home-service businesses.',
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
