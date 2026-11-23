import type { Metadata } from 'next';
import { EXECUTIVE_RECEPTIONIST_ORIGIN } from '@/lib/site-url';

export const ER_OG_IMAGE = '/er/og-default.png';
export const ER_OG_IMAGE_ALT = 'Executive Receptionist — Never send another caller to voicemail.';

/** Favicon, app icons and manifest for Executive Receptionist pages. */
export const ER_ICON_METADATA: Pick<Metadata, 'icons' | 'manifest'> = {
  icons: {
    icon: [
      { url: '/er/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/er/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/er/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/er/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/er/site.webmanifest',
};

/** Metadata for an Executive Receptionist-only page. Canonical is always executivereceptionist.com. */
export function erMetadata(path: string, title: string, description: string): Metadata {
  const canonical = `${EXECUTIVE_RECEPTIONIST_ORIGIN}${path}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    ...ER_ICON_METADATA,
    openGraph: {
      images: [{ url: ER_OG_IMAGE, width: 1200, height: 630, alt: ER_OG_IMAGE_ALT }],
      title,
      description,
      url: canonical,
      siteName: 'Executive Receptionist',
      type: 'website',
    },
    twitter: { images: [ER_OG_IMAGE], card: 'summary_large_image', title, description },
  };
}
