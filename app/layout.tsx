import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Workforce AI | Managed Postcard Campaigns for Home Services',
  description: 'Launch a managed property-concept postcard campaign with QR estimate pages for landscaping and home-service businesses.'
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
