import type { Metadata } from 'next';
import Link from 'next/link';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { absoluteSiteUrl } from '@/lib/site-url';
import styles from '../privacy/privacy.module.css';

const seo = pageSeo('/sms');
const title = renderedTitle(seo);
const description = seo.description;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/sms' },
  openGraph: {
    title,
    description,
    siteName: 'Front Porch Growth',
    type: 'website',
    url: absoluteSiteUrl('/sms'),
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
};

export default function SmsTermsPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/receptionist">Executive Receptionist</Link>
        <b>SMS terms</b>
      </nav>
      <article className={styles.article}>
        <h1>SMS terms</h1>
        <p>
          These terms describe text messages sent by Executive Receptionist (operated by Cole Collins, doing business as
          Executive Receptionist) on behalf of a subscribing client business.
        </p>

        <h2>Program name</h2>
        <p>Executive Receptionist caller notifications (missed-call callbacks and booking confirmations).</p>

        <h2>How consent works</h2>
        <p>
          Callers give consent on the phone before any text is sent: out loud to Ava, the virtual
          receptionist, or, when a call is missed, by pressing 1 or saying yes to a short recorded prompt.
          Every yes or no is saved before any text goes out. The exact scripts, a sample conversation, the
          confirmation text, and how consent is stored are on our <Link href="/sms-consent">SMS consent</Link>{' '}
          page. Consent is optional. Business owners can also agree in writing: the setup form has a
          checkbox, unchecked by default, for lead-alert texts to their own mobile number. The exact
          checkbox and wording are shown on the same <Link href="/sms-consent">SMS consent</Link> page.
        </p>

        <h2>Who receives texts</h2>
        <p>
          Texts go only to callers who called a participating client&apos;s business line and said yes to
          texts on that call, and to business owners who opted in in writing for lead alerts to their own
          mobile number. We do not text numbers from purchased lists, and we do not send marketing or
          promotional texts.
        </p>

        <h2>What you&apos;ll get</h2>
        <p>
          Transactional texts about your call, sent as Executive Receptionist on behalf of the business you
          called: a confirmation that you opted in, a missed-call callback if no one could answer or the call
          dropped (inviting you to reply or call back), and a booking confirmation if an appointment was
          set. Further messages on that thread are human follow-up, not extra automated blasts.
        </p>

        <h2>Message frequency</h2>
        <p>
          A few texts per call at most: one opt-in confirmation, at most one automated callback text per
          missed call, and one booking confirmation per booked appointment. If you call again and say yes
          again, you may receive texts about that call too.
        </p>

        <h2>Cost</h2>
        <p>Message and data rates may apply.</p>

        <h2>STOP and HELP</h2>
        <p>
          Reply STOP to opt out of further automated texts from this program. Reply HELP for help.
          Carriers are not liable for delayed or undelivered messages.
        </p>

        <h2>Contact</h2>
        <p>
          Help:{' '}
          <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a>
          {' '}or (256) 595-3354.
          <br />
          Executive Receptionist
          <br />
          12476 County Road 747
          <br />
          Hanceville, AL 35077
        </p>

        <h2>No marketing and no sharing of mobile numbers for marketing</h2>
        <p>
          This program is transactional customer care only. We do not send marketing texts to callers. We do not sell,
          rent, or share mobile phone numbers or text-messaging opt-in data or consent with third parties or affiliates
          for marketing or promotional purposes.
        </p>
        <p>
          Full details on how we handle caller phone numbers are in our <Link href="/privacy">Privacy Policy</Link>.
          Owner lead-alert texts (to a shop owner who opted in during setup) are described separately on our{' '}
          <Link href="/terms">Terms</Link> page.
        </p>
      </article>
    </main>
  );
}
