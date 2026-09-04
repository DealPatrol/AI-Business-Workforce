import Link from 'next/link';
import { Leaf } from 'lucide-react';
import LoginForm from './login-form';
import styles from './login.module.css';

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

const ALLOWED_RETURN_PATHS = new Set(['/dashboard', '/dashboard/campaigns']);

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const returnTo = next && ALLOWED_RETURN_PATHS.has(next) ? next : '/dashboard/campaigns';

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
