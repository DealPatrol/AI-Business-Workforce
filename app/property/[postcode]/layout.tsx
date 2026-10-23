import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { metadataTitle, pageSeo } from '@/lib/seo/pages';

const seo = pageSeo('/property/[postcode]');

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
};

export default function PropertyLayout({ children }: { children: ReactNode }) {
  return children;
}
