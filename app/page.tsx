import type { Metadata } from 'next';
import Link from 'next/link';
import { InvoicingWaitlistForm } from '@/components/suite/InvoicingWaitlistForm';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';

const title = 'Front Porch Growth';
const description =
  'Front Porch Growth is the home for YardProof postcards, the Ava AI receptionist, Lead Finder, and invoicing for home-service businesses.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/' },
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'Front Porch Growth',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function SuiteHomePage() {
  return (
    <SuiteShell>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>HOME-SERVICE TOOLS</span>
          <h1>The front porch for growing a service business.</h1>
          <p className={styles.lede}>
            Postcards that show the job, an AI receptionist that answers the call, a lead finder you approve before anything sends, and invoicing when it is ready.
          </p>
          <div className={styles.priceRow}>
            <span>Postcards founding offer $99/month</span>
            <span>Ava from $79/month</span>
          </div>
        </div>
        <p className={styles.lede}>
          YardProof postcards are the live managed campaign. Ava is a separate receptionist with a 7-day trial. Lead Finder stays inside the signed-in workspace. Invoicing is a waitlist, not a product you can buy yet.
        </p>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <span className={styles.kicker}>POSTCARDS</span>
          <h2>
            <Link href="/postcards">YardProof</Link>
          </h2>
          <p>Managed postcard campaigns with a QR page where the homeowner can request an estimate. You approve the concept, audience, and costs before anything mails.</p>
          <p className={styles.price}>$99/month</p>
          <p className={styles.quiet}>Founding offer for the first managed campaign.</p>
          <Link className={styles.button} href="/postcards">
            See postcard campaigns
          </Link>
        </article>

        <article className={styles.card}>
          <span className={styles.kicker}>AI RECEPTIONIST</span>
          <h2>
            <Link href="/ava">Ava</Link>
          </h2>
          <p>Ava answers missed and after-hours calls, qualifies the lead, and texts you. Starter, Growth, and Pro stay on their own prices.</p>
          <p className={styles.price}>$79 / $149 / $299 a month</p>
          <p className={styles.quiet}>Free 7-day trial. $0 setup.</p>
          <Link className={styles.button} href="/ava">
            See Ava
          </Link>
        </article>

        <article className={styles.card}>
          <span className={styles.kicker}>LEAD FINDER</span>
          <h2>
            <Link href="/dashboard/prospector">Lead Finder</Link>
          </h2>
          <p>Turn a website into buyer types, search Google Maps, and draft outreach. Every send stays approved, capped, and off until cold email is explicitly enabled.</p>
          <p className={styles.price}>Operator workspace</p>
          <p className={styles.quiet}>Sign in with the same account as the campaign inbox.</p>
          <Link className={styles.button} href="/dashboard/prospector">
            Open Lead Finder
          </Link>
        </article>

        <article className={styles.card} id="invoicing">
          <span className={styles.soon}>COMING SOON</span>
          <h2>Invoicing</h2>
          <p>Estimates and invoices for the jobs the other tools bring in. Join the list and we save it. This form does not send email.</p>
          <InvoicingWaitlistForm />
        </article>
      </section>
    </SuiteShell>
  );
}
