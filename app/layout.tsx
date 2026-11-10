import './globals.css';
import './campaign-demo.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { AdTracking } from '@/components/analytics/AdTracking';
import { CaptureAttribution } from '@/components/analytics/CaptureAttribution';
import { legacyHomeAnchorScript } from '@/lib/legacy-home-anchors';
import { ROOT_DESCRIPTION, ROOT_TITLE } from '@/lib/seo/pages';
import { getSiteUrl } from '@/lib/site-url';

const title = ROOT_TITLE;
const description = ROOT_DESCRIPTION;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: title,
    template: '%s | Front Porch Growth',
  },
  description,
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'Front Porch Growth',
    type: 'website',
    images: [{ url: '/og-home.png', width: 1200, height: 630, alt: 'Front Porch Growth AI receptionist for home service businesses' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-home.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f7f8f5'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-background">
      <body>
        <script dangerouslySetInnerHTML={{ __html: legacyHomeAnchorScript() }} />
        <CaptureAttribution />
        <AdTracking />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
