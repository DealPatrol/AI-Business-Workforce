import { Cormorant_Garamond, Outfit } from 'next/font/google';
import type { ReactNode } from 'react';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--er-serif',
  display: 'swap',
});

const sans = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--er-sans',
  display: 'swap',
});

export default function ReceptionistLayout({ children }: { children: ReactNode }) {
  return <div className={`${serif.variable} ${sans.variable}`}>{children}</div>;
}
