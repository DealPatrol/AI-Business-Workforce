import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { absoluteSiteUrl } from '@/lib/site-url';

const title = 'Front Porch Dispatch setup | Front Porch Dispatch by Workforce AI';
const description =
  'Tell us about your business so Cole can set up Front Porch Dispatch. It answers calls and texts you the lead. Free 7-day trial, then $79/mo. $0 setup.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/onboarding/ava' },
  robots: { index: false, follow: false },
  openGraph: {
    title,
    description,
    siteName: 'Front Porch Dispatch by Workforce AI',
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
