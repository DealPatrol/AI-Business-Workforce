import type { Metadata } from 'next';
import Link from 'next/link';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { absoluteSiteUrl } from '@/lib/site-url';
import styles from '../privacy/privacy.module.css';

const seo = pageSeo('/sms-consent');
const title = renderedTitle(seo);
const description = seo.description;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/sms-consent' },
  openGraph: {
    title,
    description,
    siteName: 'Front Porch Growth',
    type: 'website',
    url: absoluteSiteUrl('/sms-consent'),
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
};

export default function SmsConsentPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/receptionist">Executive Receptionist</Link>
        <b>SMS verbal consent</b>
      </nav>
      <article className={styles.article}>
        <h1>SMS verbal consent script</h1>
        <p>
          This page is the public record of how Executive Receptionist (operated by Cole Collins, doing
          business as Executive Receptionist) obtains verbal consent before sending text messages to a
          caller on behalf of a subscribing client business. Texts are transactional only: a missed-call
          callback if the call is missed or disconnected, or a booking confirmation if an appointment is
          scheduled. We do not send marketing texts, and we do not text numbers from purchased lists.
        </p>
        <p>
          Consent is optional. A caller can say no and still complete the call, leave a message, or book
          an appointment. We do not text a number unless the caller has clearly said yes, or pressed 1,
          to the script below. Full program terms are on our <Link href="/sms">SMS terms</Link> page.
          Privacy details are in our <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>Verbal consent script (Ava or the opening greeting)</h2>
        <p>
          Ava, the virtual receptionist, says the following before any text is sent. &quot;[Business]&quot; is
          the client business the person called.
        </p>
        <pre>
          {`This is Ava with Executive Receptionist, helping [Business]. Would you like me to text you at the number you're calling from about this call? I would only text you things like a missed-call callback if we get disconnected, or a booking confirmation if we set an appointment. At most a few texts about this visit. Message and data rates may apply. You can reply STOP anytime to opt out, or HELP for help. This is optional — I can still take your message if you'd rather not get texts. Would you like to receive these texts? Please say yes or no.`}
        </pre>

        <h2>Opening greeting if no one has answered yet</h2>
        <p>
          If the call connects before Ava or a person is on the line (so a missed-call text could still
          be needed), the same consent is requested first:
        </p>
        <pre>
          {`You've reached [Business]. This is Executive Receptionist, the virtual receptionist for this shop. If you'd like, we can text the number you're calling from about this visit — for example, one callback text if we miss you, or a booking confirmation if we schedule an appointment. A few texts about this visit at most. Message and data rates may apply. You can reply STOP at any time to opt out, or HELP for help. This is optional, and we can still take your call if you say no. Do you agree to these texts? Please say yes or press 1 for yes. Say no or press 2 if you don't want texts.`}
        </pre>

        <h2>Simulated conversation</h2>
        <pre>
          {`Ava: Thank you for calling Maple Ridge Heating and Air, this is Ava, the AI receptionist with Executive Receptionist. How can I help you today?
Caller: My heat went out this morning. I need someone to come look at it.
Ava: I'm sorry you're dealing with that. I can take the details for Maple Ridge. Before we go on — would you like me to text you at the number you're calling from about this call? I would only text you things like a missed-call callback if we get disconnected, or a booking confirmation if we set an appointment. At most a few texts about this visit. Message and data rates may apply. You can reply STOP anytime to opt out, or HELP for help. This is optional — I can still take your message if you'd rather not get texts. Would you like to receive these texts? Please say yes or no.
Caller: Yes.
Ava: Thanks. I'll send a short text now to confirm. If you ever want to stop, just reply STOP. What's your name?
Caller: Jordan Hale.
Ava: Thanks, Jordan. What's the best callback number, and is that the same number you're calling from?`}
        </pre>
        <p>If the caller says no, or presses 2:</p>
        <pre>
          {`Ava: No problem. I won't text you. I can still take your message. What's your name?`}
        </pre>
        <p>No automated text is sent unless the caller gave a clear yes (or pressed 1).</p>

        <h2>Confirmation text after a verbal yes</h2>
        <p>After the caller says yes, we send this confirmation:</p>
        <pre>
          {`Executive Receptionist: You're opted in for texts about your call to [Business], like a missed-call callback or booking confirmation. Msg freq: a few texts per visit at most. Msg & data rates may apply. Reply STOP to opt out, HELP for help.`}
        </pre>

        <h2>Example program texts after consent</h2>
        <p>Missed-call callback (at most one automated text per missed inbound call):</p>
        <pre>
          {`Executive Receptionist: Sorry we missed your call for [Business]. Reply with what you need or call us back at [Business phone]. Msg & data rates may apply. Reply STOP to opt out, HELP for help.`}
        </pre>
        <p>Booking confirmation (one text per booked appointment, only if the caller already said yes):</p>
        <pre>
          {`Executive Receptionist: You're booked with [Business] for [window]. The team will confirm before the visit. Msg & data rates may apply. Reply HELP for help, STOP to opt out.`}
        </pre>

        <h2>How to opt out or get help after consent</h2>
        <p>
          Reply <strong>STOP</strong> to opt out of further automated texts from this program. Reply{' '}
          <strong>HELP</strong> for help. Message and data rates may apply. Carriers are not liable for
          delayed or undelivered messages. Help is also available at{' '}
          <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a> or (256) 595-3354.
        </p>

        <h2>How verbal consent is recorded and stored</h2>
        <p>
          Calls may be recorded and transcribed. When a caller says yes or no to the script above, we
          keep a consent record with the phone number, the date and time, the call identifier, that
          consent was verbal, the script version, and the caller&apos;s yes or no. We use that record
          only to send the texts the caller agreed to and to show consent if asked. We do not sell,
          rent, or share mobile phone numbers or text-messaging opt-in data or consent with third
          parties or affiliates for marketing or promotional purposes. Mobile numbers are used only to
          deliver these texts through our messaging provider, Twilio, which processes them only to send
          the messages for us.
        </p>

        <h2>Contact</h2>
        <p>
          Executive Receptionist
          <br />
          Cole Collins
          <br />
          12476 County Road 747
          <br />
          Hanceville, AL 35077
          <br />
          <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a>
          {' '}· (256) 595-3354
        </p>
        <p>
          <Link href="/sms">SMS terms</Link>
          {' · '}
          <Link href="/privacy">Privacy Policy</Link>
        </p>
      </article>
    </main>
  );
}
