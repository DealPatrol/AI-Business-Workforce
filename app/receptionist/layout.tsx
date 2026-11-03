import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import { AvaViewContent } from '@/components/analytics/AvaViewContent';
import { DemoCallLeadTracking } from '@/components/analytics/DemoCallLeadTracking';

// Self-hosted (latin subset, SIL OFL) so the build never depends on fetching
// from Google Fonts.
const serif = localFont({
  src: [
    { path: './fonts/CormorantGaramond-latin-normal.woff2', weight: '500 700', style: 'normal' },
    { path: './fonts/CormorantGaramond-latin-italic.woff2', weight: '500 700', style: 'italic' },
  ],
  variable: '--er-serif',
  display: 'swap',
});

const sans = localFont({
  src: [{ path: './fonts/Outfit-latin-variable.woff2', weight: '300 600', style: 'normal' }],
  variable: '--er-sans',
  display: 'swap',
});

export default function ReceptionistLayout({ children }: { children: ReactNode }) {
  return <div className={`${serif.variable} ${sans.variable}`}>
      <AvaViewContent />
      <DemoCallLeadTracking />
      {children}
    </div>;
}
