import Link from 'next/link';
import type { ReactNode } from 'react';
import { Leaf } from 'lucide-react';
import SignOutButton from './sign-out-button';
import styles from './prospector.module.css';

export default function ProspectorShell({
  active,
  children,
}: {
  active: 'finder' | 'settings';
  children: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <span><Leaf size={16} /></span>
          YardProof
        </Link>
        <nav>
          <Link href="/dashboard">Overview</Link>
          <Link href="/dashboard/prospector" className={active === 'finder' ? styles.active : undefined}>
            Lead Finder
          </Link>
          <Link href="/dashboard/prospector/settings" className={active === 'settings' ? styles.active : undefined}>
            Sending settings
          </Link>
          <Link href="/dashboard/campaigns">QR lead inbox</Link>
        </nav>
        <SignOutButton />
      </aside>
      <section className={styles.main}>{children}</section>
    </main>
  );
}
