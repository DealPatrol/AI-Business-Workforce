import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { metadataTitle, pageSeo } from '@/lib/seo/pages';

const seo = pageSeo('/audit');

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  robots: { index: false, follow: false },
};

export default function AuditLayout({ children }: { children: ReactNode }) {
  return children;
}
