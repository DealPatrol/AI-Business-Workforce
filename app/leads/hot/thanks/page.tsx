import type { Metadata } from 'next';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { loadHotThanks } from '@/lib/lead-lists/hot-thanks';
import { LEAD_LIST_SUPPORT_EMAIL } from '@/lib/lead-lists/offers';
import { metadataTitle, pageSeo } from '@/lib/seo/pages';
import styles from '../../leads.module.css';

const seo = pageSeo('/leads/hot/thanks');

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ session_id?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

export default async function HotLeadsThanksPage({ searchParams }: PageProps) {
  const sessionId = firstParam((await searchParams).session_id);
  const view = await loadHotThanks(sessionId);

  return (
    <SuiteShell>
      {view.showAddon ? (
        <>
          <section className={styles.hero}>
            <span className={styles.eyebrow}>ORDER RECEIVED</span>
            <h1>Your 500 Hot Leads are being built</h1>
            <p className={styles.lede}>
              We&apos;re putting together 500 publicly listed businesses
              {view.industry ? <> in {view.industry}</> : null}
              {view.area ? <> for {view.area}</> : null}. We&apos;ll email the CSV within 24 hours.
            </p>
          </section>

          <section className={styles.block}>
            <div className={`${styles.offer} ${styles.offerFeatured}`}>
              <span className={styles.eyebrow}>OPTIONAL ADD-ON</span>
              <h3>Want 1,000 more leads for $20?</h3>
              <div className={styles.price}>
                $20 <small>one time</small>
              </div>
              <p>
                Add 1,000 more publicly listed businesses in the same industry and area, or nearby
                areas if we need them to reach 1,000. We remove any duplicates from your first 500
                and email the CSV within 24 hours. If we can&apos;t deliver, we refund you.
              </p>
              <ul className={styles.list}>
                <li>Same industry and area as your first order, or nearby areas</li>
                <li>No duplicates from your first 500</li>
                <li>Business name, website, city, state, and public email where listed</li>
                <li>No phone numbers</li>
              </ul>
              <div className={styles.ctaRow}>
                <a className={styles.cta} href={view.addonHref}>
                  Add 1,000 more leads for $20
                </a>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className={styles.hero}>
          <span className={styles.eyebrow}>THANKS</span>
          <h1>Thanks! Your order is in.</h1>
          <p className={styles.lede}>
            If you just paid, look for a confirmation from Stripe. We&apos;ll email your list as a
            CSV when it&apos;s ready.
          </p>
        </section>
      )}

      <section className={styles.block}>
        <p className={styles.fine}>Questions about your order? Email {LEAD_LIST_SUPPORT_EMAIL}.</p>
      </section>
    </SuiteShell>
  );
}
