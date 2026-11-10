import '../receptionist-demo/receptionist.css';
import '../receptionist-demo/sales-upgrade.css';
import '../receptionist-demo/text-preview.css';
import './ava-extras.css';
import './ava-redesign.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AvaViewContent } from '@/components/analytics/AvaViewContent';
import { urlsForRequest } from '@/lib/seo/host-metadata';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';

const seo = pageSeo('/ava');
const title = renderedTitle(seo);

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { canonical, openGraphUrl } = await urlsForRequest('/ava', '/ava');
  return {
    title: metadataTitle(seo),
    description: seo.description,
    alternates: { canonical },
    openGraph: { images: ['/og-default.png'],
      title,
      description: seo.description,
      url: openGraphUrl,
      siteName: 'Executive Receptionist',
      type: 'website',
    },
    twitter: { images: ['/og-default.png'],
      card: 'summary_large_image',
      title,
      description: seo.description,
    },
  };
}

export default function AvaLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AvaViewContent />
      {children}
    </>
  );
}
