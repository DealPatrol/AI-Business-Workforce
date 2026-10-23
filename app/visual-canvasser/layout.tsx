import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';

const seo = pageSeo('/visual-canvasser');

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  openGraph: { title: renderedTitle(seo), description: seo.description },
};

export default function VisualCanvasserLayout({ children }: { children: ReactNode }) {
  return children;
}
