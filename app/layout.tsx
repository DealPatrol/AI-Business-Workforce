import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workforce AI | Personalized Property Postcards',
  description: 'Create realistic before-and-after property concepts, personalized postcards, and QR landing pages for local service businesses.'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f7f8f5'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className="bg-background"><body>{children}</body></html>;
}
