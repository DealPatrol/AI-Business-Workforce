import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const title = 'YardProof | Managed Postcard Campaigns for Home Services';
const description =
  'Launch a managed property-concept postcard campaign with QR estimate pages for landscaping and home-service businesses.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: 'YardProof',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f7f8f5'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className="bg-background"><body>{children}</body></html>;
}
