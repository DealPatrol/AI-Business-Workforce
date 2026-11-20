import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { LEAD_LIST_LINKS, LEAD_LIST_SUPPORT_EMAIL } from '@/lib/lead-lists/offers';
import { metadataTitle, pageSeo } from '@/lib/seo/pages';
import styles from '../leads.module.css';

const seo = pageSeo('/leads/thanks');

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  robots: { index: false, follow: false },
};

export default function LeadListThanksPage() {
  return (
    <SuiteShell>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>ORDER RECEIVED</span>
        <h1>Thanks! Your list is on the way.</h1>
        <p className={styles.lede}>
          We’re building your 1,000-lead list for the industry you chose, and we’ll email it to you as a CSV. If we can’t reach 1,000 in that industry, we’ll add related industries or refund you.
        </p>
      </section>

      <section className={styles.block}>
        <div className={`${styles.offer} ${styles.offerFeatured}`}>
          <span className={styles.eyebrow}>ADD-ON FOR NEW ORDERS</span>
          <h3>Add a second 1,000-lead list for $15</h3>
          <p>
            Pick a different industry, or the same industry in a specific state. Same format, same promise. It’s $5 less than
            your first list, because we’re already building yours.
          </p>
          <ul className={styles.list}>
            <li>1,000 more businesses with website, public email, city, and state</li>
            <li>Duplicates removed against your first list</li>
            <li>If we can’t reach 1,000, we add related industries or refund you</li>
          </ul>
          <div className={styles.ctaRow}>
            <a className={styles.cta} href={LEAD_LIST_LINKS.secondList}>
              Yes, add a second list for $15
            </a>
            <Link className={styles.skip} href="/leads/more">
              No thanks, skip this
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.block}>
        <p className={styles.fine}>Questions about your order? Email {LEAD_LIST_SUPPORT_EMAIL}.</p>
      </section>
    </SuiteShell>
  );
}
