import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './suite.module.css';

const NAV = [
  { href: '/#samples', label: 'Hear Ava' },
  { href: '/start', label: 'Ava for your business' },
  { href: '/postcards', label: 'Postcards' },
  { href: '/lead-scout', label: 'Leads' },
  { href: '/agents', label: 'Agents' },
  { href: '/compare', label: 'Compare' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/login?next=/desk', label: 'Sign in' },
];

export function SuiteShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <nav className={styles.nav} aria-label="Primary">
        <Link className={styles.brand} href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand-header.png"
            alt="Front Porch Growth"
            width={275}
            height={36}
            style={{ display: 'block', height: 36, width: 'auto', maxWidth: '62vw', objectFit: 'contain', objectPosition: 'left center' }}
          />
        </Link>
        <div className={styles.navLinks}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <Link className={styles.navCta} href="/#pricing">
          Start free pilot
        </Link>
      </nav>
      {children}
      <footer className={styles.footer}>
        <p>Front Porch Growth · Cole · colecollins763@gmail.com</p>
        <nav>
          <Link href="/missed-call">Missed-Call Text-Back</Link>
          <Link href="/google-profile">Google Profile Setup</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/sms">SMS terms</Link>
        </nav>
      </footer>
    </div>
  );
}
