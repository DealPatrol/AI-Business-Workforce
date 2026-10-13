import type { Metadata } from 'next';
import { RequireAccess } from '@/components/access/RequireAccess';
import './demo.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DemoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const nextPath = /^[a-z0-9-]+$/.test(slug) ? `/demo/${slug}` : '/dashboard';
  return (
    <RequireAccess nextPath={nextPath}>
      <div className="personalized-demo-layout">{children}</div>
    </RequireAccess>
  );
}
