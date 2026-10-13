import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { RequireAccess } from '@/components/access/RequireAccess';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SalesLayout({ children }: { children: ReactNode }) {
  return <RequireAccess nextPath="/sales">{children}</RequireAccess>;
}
