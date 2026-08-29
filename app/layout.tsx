import './globals.css';
import type { Metadata } from 'next';

const title = 'YardProof | Personalized Property Postcards';
const description =
  'Create realistic before-and-after property concepts, personalized postcards, and QR landing pages for local service businesses.';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className="bg-background"><body>{children}</body></html>;
}
