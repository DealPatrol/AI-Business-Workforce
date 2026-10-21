import './receptionist.css';
import './sales-upgrade.css';
import './text-preview.css';
import type { Metadata } from 'next';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';

const seo = pageSeo('/receptionist-demo');
const title = renderedTitle(seo);
const description = seo.description;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/receptionist-demo' },
  openGraph: {
    title,
    description,
    url: '/receptionist-demo',
    siteName: 'Executive Receptionist',
    type: 'website',
  },
};

export default function ReceptionistDemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
