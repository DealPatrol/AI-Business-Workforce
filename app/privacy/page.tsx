import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './privacy.module.css';
import { absoluteSiteUrl } from '@/lib/site-url';

const title = 'Privacy | Ava by Workforce AI';
const description =
  'What Ava by Workforce AI (DealPatrol) collects: setup form details, call and lead data, and advertising cookies when measurement tags are turned on.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/privacy' },
  openGraph: {
    title,
    description,
    siteName: 'Ava by Workforce AI',
    type: 'website',
    url: absoluteSiteUrl('/privacy'),
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/ava">Ava</Link>
        <b>Ava by Workforce AI</b>
      </nav>
      <article className={styles.article}>
        <h1>Privacy</h1>
        <p>
          Ava is an AI phone receptionist offered as Ava by Workforce AI and operated by DealPatrol.
        </p>
        <p>
          Email <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a>
          <br />
          DealPatrol
          <br />
          12476 County Road 747
          <br />
          Hanceville, AL 35077
        </p>

        <h2>Setup form</h2>
        <p>
          If you start a trial or send the setup form, we collect the business details you type in:
          business name, hours, services, how calls should be handled, staff name, a phone number or
          email, and any notes you add about urgent calls. We use that to set Ava up for your business.
        </p>

        <h2>Calls and leads</h2>
        <p>
          When Ava answers a call, she collects the caller&apos;s name, phone number, and what they
          need, along with a summary of the call. That lead is texted to the business owner. We keep
          those details so the owner can call the person back and so we can operate the service.
        </p>

        <h2>Advertising cookies and pixels</h2>
        <p>
          When advertising measurement is turned on, this site may load a Google tag (Google Ads and,
          if configured, Google Analytics) and a Meta Pixel. Those tools set cookies and record page
          visits and events such as starting a demo conversation, starting checkout, and submitting the
          setup form. If you submit the setup form, we may send the email or phone number from that
          form to Google and Meta so they can tell whether an ad led to the form. They may hash that
          contact information. The same form submission can also be sent from our server to Meta, using
          a shared event id, so a browser event and a server event are not counted twice.
        </p>
        <p>
          These tags are not loaded unless we have configured their IDs. If the IDs are not set, the
          tags are not added to the page.
        </p>

        <h2>How we use this</h2>
        <p>
          We use the information above to set up Ava, send lead texts to the owner, run the service,
          and measure advertising. We do not sell personal information.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this page: <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a>
          <br />
          DealPatrol, 12476 County Road 747, Hanceville, AL 35077
        </p>
        <p>
          <Link href="/ava">Back to Ava</Link>
        </p>
      </article>
    </main>
  );
}
