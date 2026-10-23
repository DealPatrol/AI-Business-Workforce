import '../receptionist-demo/receptionist.css';
import '../receptionist-demo/sales-upgrade.css';
import '../receptionist-demo/text-preview.css';
import './ava-extras.css';
import './ava-redesign.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AvaViewContent } from '@/components/analytics/AvaViewContent';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';

const seo = pageSeo('/ava');
const title = renderedTitle(seo);

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  alternates: { canonical: '/ava' },
  openGraph: {
    title,
    description: seo.description,
    url: '/ava',
    siteName: 'Executive Receptionist',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: seo.description,
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
