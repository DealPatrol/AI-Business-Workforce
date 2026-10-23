import type { Metadata } from 'next';
import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { metadataTitle, pageSeo } from '@/lib/seo/pages';
import LoginForm from './login-form';
import styles from './login.module.css';

const seo = pageSeo('/login');

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

const ALLOWED_RETURN_PATHS = new Set([
  '/dashboard',
  '/dashboard/campaigns',
  '/dashboard/prospector',
  '/dashboard/prospector/settings',
]);

function returnPath(next: string | undefined) {
  if (!next) return '/dashboard/campaigns';
  if (ALLOWED_RETURN_PATHS.has(next)) return next;
  if (next === '/sales' || /^\/demo\/[a-z0-9-]+$/.test(next)) return next;
  return '/dashboard/campaigns';
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const returnTo = returnPath(next);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link href="/" className={styles.brand}>
          <span><Leaf size={18} /></span>
          Workforce<b>AI</b>
        </Link>
        <span className={styles.eyebrow}>CONTRACTOR ACCESS</span>
        <h1>Campaign inbox</h1>
        <p>Sign in with the Supabase user assigned to your campaigns.</p>
        <LoginForm returnTo={returnTo} />
      </section>
    </main>
  );
}
