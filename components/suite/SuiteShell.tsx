import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './suite.module.css';

const NAV = [
  { href: '/postcards', label: 'Postcards' },
  { href: '/receptionist', label: 'Executive Receptionist' },
  { href: '/reputation', label: 'Reviews' },
  { href: '/lead-scout', label: 'Leads' },
  { href: '/agents', label: 'Agents' },
  { href: '/compare', label: 'Compare' },
  { href: '/dashboard/prospector', label: 'Lead Finder' },
  { href: '/pricing', label: 'Pricing' },
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
        <Link className={styles.navCta} href="/pricing">
          See pricing
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
        </nav>
      </footer>
    </div>
  );
}
