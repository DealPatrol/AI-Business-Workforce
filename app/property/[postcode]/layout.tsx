import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Project Concept Demo | YardProof',
  description:
    'Preview the homeowner-facing destination for a YardProof property-concept postcard campaign.',
};

export default function PropertyLayout({ children }: { children: ReactNode }) {
  return children;
}
