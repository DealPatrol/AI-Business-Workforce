import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './suite.module.css';

const NAV = [
  { href: '/postcards', label: 'Postcards' },
  { href: '/ava', label: 'Ava' },
  { href: '/dashboard/prospector', label: 'Lead Finder' },
  { href: '/pricing', label: 'Pricing' },
];

export function SuiteShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link className={styles.brand} href="/">
          Front Porch <b>Growth</b>
        </Link>
        <div className={styles.navLinks}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <Link className={styles.navCta} href="/pricing">
          See pricing
        </Link>
      </nav>
      {children}
      <footer className={styles.footer}>
        <p>Front Porch Growth · Cole · colecollins763@gmail.com</p>
        <nav>
          <Link href="/pricing">Pricing</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </footer>
    </div>
  );
}
