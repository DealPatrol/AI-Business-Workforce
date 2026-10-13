import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';

const title = 'Terms | Front Porch Growth';
const description =
  'Terms for Front Porch Growth: YardMailer postcards at $389 setup + $129/month, Executive Receptionist plans, Lead Finder, and the invoicing waitlist.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/terms' },
  openGraph: {
    title,
    description,
    url: '/terms',
    siteName: 'Front Porch Growth',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function TermsPage() {
  return (
    <SuiteShell>
      <article className={styles.legal}>
        <h1>Terms</h1>
        <p>
          Front Porch Growth is operated by DealPatrol. These terms cover the public site at this domain, including YardMailer postcards, Executive Receptionist, Lead Finder, and the invoicing waitlist.
        </p>
        <h2>Postcards</h2>
        <p>
          The YardMailer founding offer is $389 setup + $129/month for the managed postcard campaign described on the postcards page. Demo Blast 10 is $64 when a payment link is connected. You approve the concept, audience, and mailing costs before anything is mailed. Checkout is handled by Stripe.
        </p>
        <h2>Executive Receptionist</h2>
        <p>
          Executive Receptionist plans are Starter $77/month, Growth $168/month, and Pro $324/month, each with a 7-day Stripe trial and $0 setup. Those prices are Executive Receptionist’s. They are not the postcard founding offer. A phone number is attached by a person after setup. The browser demo is not a live business line.
        </p>
        <h2>Lead Finder</h2>
        <p>
          Lead Finder is a signed-in workspace. Prospect email does not send unless COLD_EMAIL_ENABLED is turned on, and the shipping transport is a stub that does not deliver mail. Approved drafts, a physical mailing address, and a working unsubscribe link are required before a send can be attempted. Unsubscribe requests at /prospector/unsubscribe are public and do not need an account.
        </p>
        <h2>Invoicing</h2>
        <p>
          Invoicing is not for sale. The waitlist stores the email, and any name or business you add, in a private table. Joining the list does not start a subscription and does not send you email.
        </p>
        <h2>Contact</h2>
        <p>
          Questions: <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a>. Privacy details are on the <Link href="/privacy">privacy page</Link>.
        </p>
      </article>
    </SuiteShell>
  );
}
