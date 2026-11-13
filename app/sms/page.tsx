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
        <p>Executive Receptionist missed-call callbacks.</p>

        <h2>How consent works</h2>
        <p>
          Callers give consent out loud on the phone with Ava, the virtual receptionist, before any text
          is sent. The exact script, a sample conversation, the confirmation text, and how consent is
          stored are on our <Link href="/sms-consent">SMS verbal consent</Link> page. Consent is optional.
        </p>

        <h2>Who receives texts</h2>
        <p>
          Texts go only to callers who dialed a participating client&apos;s business phone line and did not reach anyone
          (the call was missed, unanswered, or abandoned). We do not text numbers from purchased lists, and we do not
          send marketing or promotional texts.
        </p>

        <h2>What you&apos;ll get</h2>
        <p>
          One transactional callback text per missed call, sent as Executive Receptionist on behalf of the business you
          called. The text tells you the call was missed and invites you to reply or call back. Further messages on that
          thread are human follow-up, not extra automated blasts.
        </p>

        <h2>Message frequency</h2>
        <p>
          Message frequency is at most one automated text per missed inbound call. If you call again and that call is
          also missed, you may receive another single automated callback text for that call.
        </p>

        <h2>Cost</h2>
        <p>Message and data rates may apply.</p>

        <h2>STOP and HELP</h2>
        <p>
          Reply STOP to opt out of further automated missed-call texts from this program. Reply HELP for help.
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
