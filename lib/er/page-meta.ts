import type { Metadata } from 'next';
import { EXECUTIVE_RECEPTIONIST_ORIGIN } from '@/lib/site-url';

/** Metadata for an Executive Receptionist-only page. Canonical is always executivereceptionist.com. */
export function erMetadata(path: string, title: string, description: string): Metadata {
  const canonical = `${EXECUTIVE_RECEPTIONIST_ORIGIN}${path}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { images: ['/og-default.png'], title, description, url: canonical, siteName: 'Executive Receptionist', type: 'website' },
    twitter: { images: ['/og-default.png'], card: 'summary_large_image', title, description },
  };
}
