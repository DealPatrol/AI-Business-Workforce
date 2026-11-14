import type { Metadata } from 'next';
import Link from 'next/link';
import { SMS_CONSENT_TEXT } from '@/lib/ava/sms-consent';
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
  // The written opt-in wording below is the live SMS_CONSENT_TEXT from the setup
  // form, rendered with the same Privacy Policy / Terms links the form shows.
  // Keep the wording in sync through that constant, not by editing this page.
  const CONSENT_LINK_SUFFIX = 'See our Privacy Policy and Terms.';
  const consentLead = SMS_CONSENT_TEXT.endsWith(CONSENT_LINK_SUFFIX)
    ? SMS_CONSENT_TEXT.slice(0, -CONSENT_LINK_SUFFIX.length)
    : SMS_CONSENT_TEXT;

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/receptionist">Executive Receptionist</Link>
        <b>SMS consent</b>
      </nav>
      <article className={styles.article}>
        <h1>SMS consent</h1>
        <p>
          This page is the public record of how Executive Receptionist (operated by Cole Collins, doing
          business as Executive Receptionist) obtains consent before sending text messages. There are two
          methods. Callers give verbal consent on the phone with Ava, the virtual receptionist, before any
          missed-call callback or booking confirmation text is sent. Business owners can also give written
          consent with a checkbox on the website setup form, for lead-alert texts to their own mobile
          number. We do not send marketing texts to callers, and we do not text numbers from purchased
          lists.
        </p>
        <p>
          Consent is optional. A caller can say no and still complete the call, leave a message, or book
          an appointment. An owner can buy and use Executive Receptionist without agreeing to texts, and
          lead alerts still arrive by email. Full program terms are on our <Link href="/sms">SMS terms</Link> page.
          Privacy details are in our <Link href="/privacy">Privacy Policy</Link>, and the service terms
          are on our <Link href="/terms">Terms</Link> page.
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

        <h2>Written opt-in (website form)</h2>
        <p>
          A business owner can also agree in writing on the Executive Receptionist setup form. The box
          below is the exact opt-in control from that form, shown as it appears there. The box starts
          unchecked. Ticking it is optional and is not a condition of buying or using the service. The
          wording beside it is the exact consent language from the form:
        </p>
        <div className={styles.optinExample}>
          <label>
            <input type="checkbox" disabled defaultChecked={false} aria-label="Example SMS opt-in checkbox, unchecked" />
            <span>
              {consentLead}See our <Link href="/privacy">Privacy Policy</Link> and{' '}
              <Link href="/terms">Terms</Link>.
            </span>
          </label>
        </div>
        <p className={styles.optinCaption}>
          Example of the opt-in control on our setup form. The box starts unchecked; nothing is agreed
          to until the owner ticks it and submits the form with a mobile number.
        </p>
        <p>
          This written opt-in covers lead-alert texts to the owner&apos;s own mobile number: a text when
          Executive Receptionist takes a new lead for their business. Message frequency varies with call
          volume. No text is sent unless the box was ticked and a mobile number is on file.
        </p>

        <h2>Sample conversation (written opt-in)</h2>
        <p>
          The owner ticks the checkbox on the setup form and submits it with the business mobile number.
          No confirmation text is sent at that point; the first text is the first lead alert:
        </p>
        <pre>
          {`Executive Receptionist: New lead for Maple Ridge Heating and Air. Jordan Hale, 256-555-0148. Need: No heat. Reply STOP to opt out.`}
        </pre>
        <p>If the owner replies STOP:</p>
        <pre>
          {`Owner: STOP`}
        </pre>
        <p>
          After STOP, one automatic confirmation text is sent and no further lead texts follow. Lead
          alerts continue by email. Replying START turns lead texts back on.
        </p>

        <h2>How written consent is recorded and stored</h2>
        <p>
          When the setup form is submitted with the box ticked, we keep a consent record with the mobile
          number, the date and time it was agreed, the exact wording shown (the text above), and the IP
          address the form was submitted from. We use that record only to send the lead-alert texts the
          owner agreed to and to show consent if asked. We do not sell, rent, or share mobile phone
          numbers or text-messaging opt-in data or consent with third parties or affiliates for
          marketing or promotional purposes. Mobile numbers are used only to deliver these texts through
          our messaging provider, Twilio, which processes them only to send the messages for us.
        </p>

        <h2>How to opt out after a written opt-in</h2>
        <p>
          Reply <strong>STOP</strong> to opt out of further lead-alert texts. Reply{' '}
          <strong>START</strong> to turn them back on. Reply <strong>HELP</strong> for help. Message
          and data rates may apply. Carriers are not liable for delayed or undelivered messages. Help is
          also available at <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a> or
          (256) 595-3354.
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
          {' · '}
          <Link href="/terms">Terms</Link>
        </p>
      </article>
    </main>
  );
}
