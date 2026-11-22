import type { Metadata } from 'next';
import { HotLeadsPurchaseTracking } from '@/components/analytics/HotLeadsPurchaseTracking';
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
      {view.showDownload ? (
        <>
          <HotLeadsPurchaseTracking sessionId={view.sessionId} />
          <section className={styles.hero}>
            <span className={styles.eyebrow}>ORDER CONFIRMED</span>
            <h1>Your 500 Hot Leads are ready</h1>
            <p className={styles.lede}>
              Download the CSV now. It opens in Excel or Google Sheets. Each row has the business
              name, website, city, state, and a business email where one is available. No phone numbers.
            </p>
            {view.downloadHref ? (
              <div className={styles.ctaRow}>
                <a className={styles.cta} href={view.downloadHref}>
                  Download your 500 leads
                </a>
              </div>
            ) : null}
          </section>

          {view.showAddon ? (
          <section className={styles.block}>
            <div className={`${styles.offer} ${styles.offerFeatured}`}>
              <span className={styles.eyebrow}>OPTIONAL ADD-ON</span>
              <h3>Want 1,000 more leads for $20?</h3>
              <div className={styles.price}>
                $20 <small>one time</small>
              </div>
              <p>
                Add 1,000 more businesses in the same mixed-list format. We remove any duplicates
                from your first 500 and email that CSV within 24 hours. If we can&apos;t deliver, we refund you.
              </p>
              <ul className={styles.list}>
                <li>No duplicates from your first 500</li>
                <li>Business name, website, city, state, and business email where available</li>
                <li>No phone numbers</li>
              </ul>
              <div className={styles.ctaRow}>
                <a className={styles.cta} href={view.addonHref}>
                  Add 1,000 more leads for $20
                </a>
              </div>
            </div>
          </section>
          ) : null}
        </>
      ) : (
        <section className={styles.hero}>
          <span className={styles.eyebrow}>THANKS</span>
          <h1>Thanks! Your order is in.</h1>
          <p className={styles.lede}>
            If you just paid for 500 Hot Leads, go back through the Stripe receipt so this page can
            confirm your payment and show the download. If something looks wrong, email us.
          </p>
        </section>
      )}

      <section className={styles.block}>
        <p className={styles.fine}>Questions about your order? Email {LEAD_LIST_SUPPORT_EMAIL}.</p>
      </section>
    </SuiteShell>
  );
}
