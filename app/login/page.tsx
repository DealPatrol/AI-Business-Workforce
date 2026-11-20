import type { Metadata } from 'next';
import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { metadataTitle, pageSeo } from '@/lib/seo/pages';
import { safeReturnPath } from '@/lib/auth/return-path';
import LoginForm from './login-form';
import styles from './login.module.css';

const seo = pageSeo('/login');

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  const returnTo = safeReturnPath(next);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link href="/" className={styles.brand}>
          <span><Leaf size={18} /></span>
          Front Porch<b>Growth</b>
        </Link>
        <span className={styles.eyebrow}>CUSTOMER SIGN IN</span>
        <h1>Your desk</h1>
        <p>Use the email you checked out with. We can email you a sign-in link, or use your password if you set one.</p>
        {error ? <p className={styles.error} role="alert">That sign-in link expired or was already used. Request a new one.</p> : null}
        <LoginForm returnTo={returnTo} />
        <p className={styles.after}>
          Not a customer yet? You do not need an account to buy.{' '}
          <Link href="/#pricing">See plans</Link> (Starter is $1 for the first month).
        </p>
      </section>
    </main>
  );
}
