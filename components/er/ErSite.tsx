import Link from 'next/link';
import type { ReactNode } from 'react';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { JsonLd } from '@/components/ava/JsonLd';
import { SisterSites } from '@/components/seo/SisterSites';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { ER_NAV, erFooterColumns } from '@/lib/er/site-links';
import { ErLogoMark } from '@/components/er/ErLogoMark';
import styles from './er-site.module.css';

/** Demo line above the fold on every Executive Receptionist template. */
export function ErDemoBar() {
  return (
    <div className={styles.demoBar} role="note" aria-label="Call the demo line">
      <div className={styles.demoBarInner}>
        <span>
          Hear Ava now: call the demo line <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a>
        </span>
        <small>She answers as {AVA_DEMO_LINE.answersAs}.</small>
      </div>
    </div>
  );
}

export function ErSiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.logo}>
          <ErLogoMark className={styles.logoMark} />
          Executive Receptionist
        </Link>
        <nav aria-label="Main" className={styles.nav}>
          {ER_NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/desk">Log in</Link>
        </nav>
        <span className={styles.headerCta}>
          <TrackedCheckoutLink className={styles.btnDark} href="/api/checkout?plan=starter" plan="starter">
            Start for $1
          </TrackedCheckoutLink>
        </span>
      </div>
    </header>
  );
}

/** Footer links for every hub and every trade page, so none are orphans. */
export function ErFooterColumns({ className }: { className?: string }) {
  return (
    <div className={className || styles.footerCols}>
      {erFooterColumns().map((col) => (
        <nav key={col.heading} aria-label={col.heading}>
          <h2>{col.heading}</h2>
          <ul>
            {col.links.map((link) => (
              <li key={`${col.heading}-${link.href}`}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  );
}

/** Link columns for templates that keep their own footer (hvac, industry pages, blog). */
export function ErLinkColumns() {
  return (
    <section className={`${styles.shell} ${styles.footer}`} aria-label="Site links">
      <div className={styles.wrap}>
        <ErFooterColumns />
      </div>
    </section>
  );
}

export function ErSiteFooter() {
  return (
    <footer className={`${styles.shell} ${styles.footer}`}>
      <div className={styles.wrap}>
        <ErFooterColumns />
        <div className={styles.footerBottom}>
          <p>
            Questions? Call <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a> or email{' '}
            <a href={`mailto:${AVA_OFFER.contactEmail}`}>{AVA_OFFER.contactEmail}</a>. Demo line:{' '}
            <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a>.
          </p>
          <p>{AVA_OFFER.footerLine}.</p>
          <SisterSites
            selfUrl="https://executivereceptionist.com"
            clusters={['home-services', 'phone']}
            className={styles.sister}
          />
        </div>
      </div>
    </footer>
  );
}

export type Crumb = [label: string, href: string];

export function ErBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <p className={styles.crumbs}>
      {items.map(([label, href], i) => (
        <span key={href}>
          {i > 0 ? ' / ' : ''}
          {i === items.length - 1 ? label : <Link href={href}>{label}</Link>}
        </span>
      ))}
    </p>
  );
}

/** Closing three-card CTA used on every sales template. */
export function ErCloser({ heading = 'Hear her, then put her on your line.' }: { heading?: string }) {
  return (
    <section className={styles.closer}>
      <div className={styles.wrap}>
        <h2>{heading}</h2>
        <div className={styles.closerGrid}>
          <a className={styles.closerCard} href={AVA_DEMO_LINE.href}>
            <strong>Call the demo line</strong>
            {AVA_DEMO_LINE.display}, any time.
          </a>
          <Link className={styles.closerCard} href="/pricing">
            <strong>See pricing</strong>
            Five monthly plans, $25 to $789.
          </Link>
          <Link className={styles.closerCard} href="/start">
            <strong>Start for $1</strong>
            Starter’s first month is $1, then $79/month.
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ErShell({ children, jsonLd }: { children: ReactNode; jsonLd?: object }) {
  return (
    <div className={styles.shell}>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <ErDemoBar />
      <ErSiteHeader />
      <main>{children}</main>
      <ErCloser />
      <ErSiteFooter />
    </div>
  );
}

export { styles as erStyles };

/** Demo bar + main nav, for templates that keep their own page styles. */
export function ErTopBars() {
  return (
    <div className={styles.shell}>
      <ErDemoBar />
      <ErSiteHeader />
    </div>
  );
}
