import '../receptionist-demo/receptionist.css';
import '../receptionist-demo/sales-upgrade.css';
import '../receptionist-demo/text-preview.css';
import './ava-extras.css';
import './ava-redesign.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AvaViewContent } from '@/components/analytics/AvaViewContent';
import { avaAbsoluteUrl } from '@/lib/site';

const title = 'Ava AI Receptionist for Contractors and Small Businesses';
const description =
  'Ava answers missed and after-hours calls, qualifies the lead, and texts you. Hear a sample call, then start a free 7-day trial. Plans are $79, $149, and $299 a month with $0 setup.';

export const metadata: Metadata = {
  metadataBase: new URL(avaAbsoluteUrl('/')),
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: 'Ava',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
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
