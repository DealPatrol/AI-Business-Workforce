import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { absoluteSiteUrl } from '@/lib/site-url';

const title = 'Executive Receptionist setup | Executive Receptionist by Workforce AI';
const description =
  'Tell us about your business so Cole can set up Executive Receptionist. It answers calls and texts you the lead. Free 7-day trial, then $79/mo. $0 setup.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/onboarding/ava' },
  robots: { index: false, follow: false },
  openGraph: {
    title,
    description,
    siteName: 'Executive Receptionist by Workforce AI',
    type: 'website',
    url: absoluteSiteUrl('/onboarding/ava'),
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function AvaOnboardingLayout({ children }: { children: ReactNode }) {
  return children;
}
