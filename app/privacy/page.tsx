import type { Metadata } from 'next';
import Link from 'next/link';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { absoluteSiteUrl } from '@/lib/site-url';
import styles from './privacy.module.css';

const seo = pageSeo('/privacy');
const title = renderedTitle(seo);
const description = seo.description;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/privacy' },
  openGraph: {
    title,
    description,
    siteName: 'Front Porch Growth',
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
        <Link href="/ava">Executive Receptionist</Link>
        <b>Executive Receptionist by Workforce AI</b>
      </nav>
      <article className={styles.article}>
        <h1>Privacy</h1>
        <p>
          Executive Receptionist is an AI phone receptionist offered as Executive Receptionist by Workforce AI and operated by DealPatrol.
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
          email, and any notes you add about urgent calls. We use that to set Executive Receptionist up for your business.
        </p>

        <h2>Calls and leads</h2>
        <p>
          When Executive Receptionist answers a call, she collects the caller&apos;s name, phone number, and what they
          need, along with a summary of the call. That lead is emailed to the business owner and, if the owner opted in, texted to them. We keep
          those details so the owner can call the person back and so we can operate the service.
        </p>
        <p>
          If you call a business that uses our missed-call callback program and no one answers, we also collect the
          caller phone number from that inbound call so we can send the single transactional text described below.
        </p>

        <h2>Text messaging (SMS)</h2>
        <p>
          If you give us a mobile number for lead texts and check the box agreeing to receive them, Executive
          Receptionist will text that number when it takes a new lead for your business. These texts are lead
          notifications only. We do not send marketing or promotional texts. Message frequency varies with your
          call volume. Message and data rates may apply. Reply STOP at any time to opt out, or HELP for help.
        </p>
        <p>
          <strong>
            We do not sell, rent, or share mobile phone numbers or text-messaging opt-in data or consent with third
            parties or affiliates for marketing or promotional purposes.
          </strong>{' '}
          Mobile numbers and opt-in consent collected for text messaging are not used for, or sent to, any
          advertising or measurement service. Text messages are sent through our messaging provider, Twilio, which
          processes them only to deliver the messages for us. Opt-in records (the number, the date and time you
          agreed, the wording you saw, and your IP address) are kept to show your consent and for as long as needed
          to run the service and meet legal requirements.
        </p>
        <p>
          Texting is optional. You will still receive lead alerts by email, and you can buy and use Executive
          Receptionist without agreeing to text messages.
        </p>

        <h2>Missed-call callback texts</h2>
        <p>
          If you call a business that uses Executive Receptionist and the call is missed, we may send you one text
          message about that missed call so you can reply or call back. These texts are sent as Executive Receptionist
          on behalf of the client business you called. They are transactional only. We do not send marketing texts to
          callers. Message frequency is at most one automated text per missed call. Message and data rates may apply.
          Reply STOP to opt out, HELP for help. SMS program details are on our <Link href="/sms">SMS terms</Link> page.
          Support: colecollins763@gmail.com or (256) 595-3354.
        </p>
        <p>
          <strong>
            We do not sell, rent, or share mobile phone numbers or text-messaging opt-in data or consent with third
            parties or affiliates for marketing or promotional purposes.
          </strong>{' '}
          Caller mobile numbers collected for missed-call text-back are used only to deliver that callback text through
          our messaging provider, Twilio, which processes them only to send the message for us. We do not use those
          numbers for advertising or measurement, and we do not share mobile opt-in data with third parties for marketing.
        </p>

        <h2>Advertising cookies and pixels</h2>
        <p>
          When advertising measurement is turned on, this site may load a Google tag (Google Ads and,
          if configured, Google Analytics) and a Meta Pixel. Those tools set cookies and record page
          visits and events such as starting a demo conversation, starting a free trial, starting checkout, and submitting the
          setup form. The trial button can send a Lead event and a StartTrial event. Each one uses its own event id in the browser and, when the server token is set, the same id again from the server so the two copies are not counted twice. If you submit the setup form, we may send the email address or phone number from that
          form to Google and Meta so they can tell whether an ad led to the form. They may hash that
          email address or phone number. The same form submission can also be sent from our server to Meta, using
          a shared event id, so a browser event and a server event are not counted twice.
        </p>
        <p>
          On the Executive Receptionist pages, the Meta Pixel may also record each page you view
          (including moves between pages), a view of the receptionist page, a tap on the live demo phone
          number (only the tap is recorded, sent as a Lead), a click on a plan&apos;s checkout button, and a StartTrial event when
          Stripe returns you to the setup page after checkout. We do not send card details to Meta.
        </p>
        <p>
          These tags are not loaded unless we have configured their IDs. If the IDs are not set, the
          tags are not added to the page.
        </p>

        <h2>How we use this</h2>
        <p>
          We use the information above to set up Executive Receptionist, send lead alerts to the owner by email and, with the owner&apos;s consent, by text, send a single transactional missed-call callback text to a caller when that program is running, operate the service,
          and measure advertising. We do not sell personal information.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this page: <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a>
          <br />
          DealPatrol, 12476 County Road 747, Hanceville, AL 35077
        </p>
        <p>
          <Link href="/ava">Back to Executive Receptionist</Link>
        </p>
      </article>
    </main>
  );
}
