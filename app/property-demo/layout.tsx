import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Property & Postcard Demo | YardMailer',
  description:
    'Explore a clearly labeled YardMailer property concept, postcard, and homeowner estimate-page demo.',
};

export default function PropertyDemoLayout({ children }: { children: ReactNode }) {
  return children;
}
