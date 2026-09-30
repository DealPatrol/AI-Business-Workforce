import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const title = 'Ava setup | Ava by Workforce AI';
const description =
  'Tell us about your business so Cole can set up Ava. She answers calls and texts you the lead. Free 7-day trial, then $79/mo. $0 setup.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: {
    title,
    description,
    siteName: 'Ava by Workforce AI',
    type: 'website',
    url: 'https://ai-business-workforce.vercel.app/onboarding/ava',
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
