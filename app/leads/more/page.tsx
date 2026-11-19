import type { Metadata } from 'next';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { CAN_SPAM_NOTE, LEAD_LIST_LINKS, LEAD_LIST_SUPPORT_EMAIL } from '@/lib/lead-lists/offers';
import { metadataTitle, pageSeo } from '@/lib/seo/pages';
import styles from '../leads.module.css';

const seo = pageSeo('/leads/more');

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  robots: { index: false, follow: false },
};

export default function LeadListMorePage() {
  return (
    <SuiteShell>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>YOUR ORDER IS IN</span>
        <h1>A list is step one. Here’s how to turn it into replies.</h1>
        <p className={styles.lede}>
          Most people who buy a list get stuck on the next part: what to say. These are optional. Your list is coming either way.
        </p>
      </section>

      <section className={styles.block}>
        <div className={styles.offers}>
          <div className={`${styles.offer} ${styles.offerFeatured}`}>
            <h3>Cold email sequence for your industry</h3>
            <div className={styles.price}>$29 <small>one time</small></div>
            <p>
              We write a ready-to-send 3-email sequence for the industry you sell to and what you sell: subject lines, a short
              first email, two follow-ups, and a CAN-SPAM footer template. Paste it into your email tool and go.
            </p>
            <a className={styles.cta} href={LEAD_LIST_LINKS.emailSequence}>Get my email sequence</a>
          </div>
          <div className={styles.offer}>
            <h3>Fresh Leads Monthly</h3>
            <div className={styles.price}>$49 <small>/ month</small></div>
            <p>
              1,000 new leads in your industry every month, with no repeats from earlier months, so your pipeline never runs dry.
              Cancel anytime.
            </p>
            <a className={styles.ctaSecondary} href={LEAD_LIST_LINKS.monthly}>Start monthly leads</a>
          </div>
          <div className={styles.offer}>
            <h3>Done-for-you outreach</h3>
            <div className={styles.price}>$297 <small>/ month</small></div>
            <p>
              We write and send your cold email campaign each month: fresh leads, the copy, and sending from your own domain or
              inbox after a short onboarding. Cancel anytime.
            </p>
            <a className={styles.ctaSecondary} href={LEAD_LIST_LINKS.outreach}>Have us run it</a>
          </div>
        </div>
      </section>

      <section className={styles.block}>
        <p className={styles.compliance}>{CAN_SPAM_NOTE}</p>
        <p className={styles.fine}>Questions? Email {LEAD_LIST_SUPPORT_EMAIL}.</p>
      </section>
    </SuiteShell>
  );
}
