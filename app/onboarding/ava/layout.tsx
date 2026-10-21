import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { absoluteSiteUrl } from '@/lib/site-url';

const seo = pageSeo('/onboarding/ava');
const title = renderedTitle(seo);
const description = seo.description;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/onboarding/ava' },
  robots: { index: false, follow: false },
  openGraph: {
    title,
    description,
    siteName: 'Executive Receptionist',
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
