import Link from 'next/link';
import styles from './fpg.module.css';
import { FPG_PUBLIC_PHONE, FPG_PUBLIC_PHONE_HREF } from '@/lib/fpg/site';

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

export function Crumbs({ items }: { items: Array<{ name: string; path: string }> }) {
  return (
    <nav className={styles.crumbs} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.path}>
          {index > 0 ? ' / ' : ''}
          {index === items.length - 1 ? item.name : <Link href={item.path}>{item.name}</Link>}
        </span>
      ))}
    </nav>
  );
}

export function FaqList({ faqs }: { faqs: ReadonlyArray<{ q: string; a: string }> }) {
  return (
    <div className={styles.faq}>
      {faqs.map((faq) => (
        <details key={faq.q}>
          <summary>{faq.q}</summary>
          <p>{faq.a}</p>
        </details>
      ))}
    </div>
  );
}

/** The same three-card closer on every Front Porch Growth page. */
export function ClosingCards({ heading = 'Pick the next step.' }: { heading?: string }) {
  return (
    <section className={styles.closing}>
      <span className={styles.kicker}>Start here</span>
      <h2 className={styles.h2}>{heading}</h2>
      <ul className={styles.grid3}>
        <li>
          <Link className={styles.card} href="/ai-visibility">
            <h3>Grade your site free</h3>
            <p>See what Google and AI assistants can read about your shop. No account, no card.</p>
          </Link>
        </li>
        <li>
          <Link className={styles.card} href="/pricing">
            <h3>See every price</h3>
            <p>Postcards, Google profile setup, AI search plans and review tools, all published.</p>
          </Link>
        </li>
        <li>
          <a className={styles.card} href={FPG_PUBLIC_PHONE_HREF}>
            <h3>Call {FPG_PUBLIC_PHONE}</h3>
            <p>Questions about postcards, your Google profile or AI search? Call before you buy.</p>
          </a>
        </li>
      </ul>
    </section>
  );
}
