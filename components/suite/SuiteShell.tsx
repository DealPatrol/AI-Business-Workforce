import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './suite.module.css';
import fpg from '@/components/fpg/fpg.module.css';
import { SisterSites } from '@/components/seo/SisterSites';
import { FPG_NAV, FPG_PUBLIC_PHONE, FPG_PUBLIC_PHONE_HREF, fpgFooterColumns } from '@/lib/fpg/site';

const SIGN_IN = { href: '/login?next=/desk', label: 'Sign in' };

export function SuiteShell({ children }: { children: ReactNode }) {
  const columns = fpgFooterColumns();
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
          {FPG_NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href={SIGN_IN.href}>{SIGN_IN.label}</Link>
        </div>
        <Link className={styles.navCta} href="/ai-visibility">
          Grade my site free
        </Link>
      </nav>
      {children}
      <footer className={styles.footer}>
        <div className={fpg.footCols}>
          {columns.map((column) => (
            <div key={column.title}>
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}`}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className={fpg.footMeta}>
          Front Porch Growth · Hanceville, Alabama · <a href={FPG_PUBLIC_PHONE_HREF}>{FPG_PUBLIC_PHONE}</a> · colecollins763@gmail.com
        </p>
        <SisterSites selfUrl="https://frontporchgrowth.com" clusters={['home-services', 'reviews']} className={styles.sisterSites} />
      </footer>
    </div>
  );
}
