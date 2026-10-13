import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Business audit',
  robots: { index: false, follow: false },
};

export default function AuditLayout({ children }: { children: ReactNode }) {
  return children;
}
