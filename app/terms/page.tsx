import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';

const seo = pageSeo('/terms');
const title = renderedTitle(seo);
const description = seo.description;

export const metadata: Metadata = {
  title: metadataTitle(seo),
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
          YardMailer postcards are a $127 one-time setup, charged once per customer, plus $3.54 per 4×6 card or $4.95 per 6×9 card. Postage, printing, and mailing are included. Orders start at 100 cards. AI designs the card, then it is printed and mailed directly to the homeowners. Checkout is a one-time Stripe payment. There is no monthly postcard plan.
        </p>
        <h2>Executive Receptionist</h2>
        <p>
          Executive Receptionist is a free 14-day pilot, then $0 until your first booked job, then $25 per booked job, capped at $297 a month. If the receptionist does not capture a single real caller lead during the pilot, you pay nothing. Those prices are Executive Receptionist’s. They are not the postcard prices. A phone number is attached by a person after setup. The browser demo is not a live business line.
        </p>
        <h2>SMS lead alerts</h2>
        <p>
          <strong>Program name:</strong> Executive Receptionist lead alerts.
        </p>
        <p>
          <strong>What you&apos;ll get:</strong> Text messages sent to the mobile number you gave during setup, telling you about a
          new lead after Executive Receptionist answers a call for your business (caller name, callback number, and what
          they need). We do not send marketing texts. Messages may include a callback phone number.
        </p>
        <p>
          <strong>How to join:</strong> Check the SMS consent box on the Executive Receptionist setup form. Agreeing is not a
          condition of buying or using any service. If you don&apos;t agree, lead alerts come to you by email only.
        </p>
        <p>
          <strong>Frequency:</strong> Message frequency varies with how many calls we take for your business.
        </p>
        <p>
          <strong>Cost:</strong> Message and data rates may apply. Executive Receptionist does not charge a separate fee for these
          texts. Your mobile carrier may charge you for messages.
        </p>
        <p>
          <strong>Opt out:</strong> Reply STOP at any time to stop receiving texts. You will get one confirmation text, and you will
          not get more lead texts after that. Lead alerts will still go to your email. Reply START to turn texts back on.
        </p>
        <p>
          <strong>Help:</strong> Reply HELP for help, or contact us at{' '}
          <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a>.
        </p>
        <p>
          <strong>Carriers:</strong> Carriers and Executive Receptionist are not liable for delayed or undelivered messages.
          Message delivery is subject to effective transmission by your wireless carrier and is not guaranteed.
        </p>
        <p>
          <strong>Privacy:</strong> We do not share mobile numbers or text opt-in data with third parties or affiliates for
          marketing. See our <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          <strong>Supported carriers:</strong> Major US carriers. Texts may not reach all numbers or carriers.
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
