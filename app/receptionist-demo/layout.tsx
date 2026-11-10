import './receptionist.css';
import './sales-upgrade.css';
import './text-preview.css';
import type { Metadata } from 'next';
import { urlsForRequest } from '@/lib/seo/host-metadata';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';

const seo = pageSeo('/receptionist-demo');
const title = renderedTitle(seo);
const description = seo.description;

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { canonical, openGraphUrl } = await urlsForRequest('/receptionist-demo', '/receptionist-demo');
  return {
    title: metadataTitle(seo),
    description,
    alternates: { canonical },
    openGraph: { images: ['/og-default.png'],
      title,
      description,
      url: openGraphUrl,
      siteName: 'Executive Receptionist',
      type: 'website',
    },
  };
}

export default function ReceptionistDemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
