import Link from 'next/link';
import type { ReactNode } from 'react';
import { ErDemoBar } from '@/components/er/ErSite';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { AVA_OFFER } from '@/lib/ava/pricing';
import styles from './editorial.module.css';

const NAV = [
  { href: '/ava', label: 'Ava' },
  { href: '/receptionist/packages', label: 'Packages' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/ava/ai-receptionist-for-hvac-and-plumbing-in-alabama', label: 'Alabama' },
  { href: '/receptionist/book-a-demo', label: 'Book a demo' },
];

/** Paper / ink / brass page frame for Executive Receptionist sales pages. */
export function EditorialShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <ErDemoBar />
      <header className={styles.masthead}>
        <div className={`${styles.wrap} ${styles.mastheadInner}`}>
          <Link href="/" className={styles.brand}>
            Executive Receptionist
          </Link>
          <nav aria-label="Main" className={styles.mastNav}>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <p>
            Executive Receptionist is run by Cole Collins in Hanceville, Alabama. Call{' '}
            <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>, email{' '}
            <a href={`mailto:${AVA_OFFER.contactEmail}`}>{AVA_OFFER.contactEmail}</a>, or hear Ava on the demo line{' '}
            <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a>.
          </p>
          <p>
            <Link href="/">Home</Link> · <Link href="/pricing">Pricing</Link> · <Link href="/receptionist/packages">Packages</Link> ·{' '}
            <Link href="/receptionist/book-a-demo">Book a demo</Link> · <Link href="/compare">Compare</Link> ·{' '}
            <Link href="/tools">Free tools</Link> · <Link href="/about">About</Link> · <Link href="/privacy">Privacy</Link> ·{' '}
            <Link href="/terms">Terms</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
