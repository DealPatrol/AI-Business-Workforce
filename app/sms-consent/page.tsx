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
          methods. Callers give consent on the phone, out loud to Ava, the virtual receptionist, or by
          pressing 1 or saying yes to a short missed-call prompt, before any missed-call callback or
          booking confirmation text is sent. Business owners can also give written
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
        <p>This public page shows, with no login required:</p>
        <ul className={styles.reviewerList}>
          <li>
            <a href="#verbal-script">Ava&apos;s exact verbal consent script</a>
          </li>
          <li>
            <a href="#sample-conversation">A sample conversation</a>
          </li>
          <li>
            <a href="#how-consent-is-stored">
              How consent is stored (consent record, timestamp, caller number, and call ID)
            </a>
          </li>
          <li>
            <a href="#caller-opt-out">How a caller opts out (STOP / HELP)</a>
          </li>
          <li>
            <a href="#owner-operator-opt-out">How a business owner or operator opts out</a>
          </li>
          <li>
            <a href="#web-form-opt-in">A full view of the website form opt-in</a>
          </li>
        </ul>

        <h2 id="verbal-script">Verbal consent script (Ava)</h2>
        <p>
          Ava, the virtual receptionist, says the following before any text is sent. &quot;[Business]&quot; is
          the client business the person called.
        </p>
        <pre>
          {`This is Ava with Executive Receptionist, helping [Business]. Would you like me to text you at the number you're calling from about this call? I would only text you things like a missed-call callback if we get disconnected, or a booking confirmation if we set an appointment. At most a few texts about this visit. Message and data rates may apply. You can reply STOP anytime to opt out, or HELP for help. This is optional — I can still take your message if you'd rather not get texts. Would you like to receive these texts? Please say yes or no.`}
        </pre>

        <h2 id="missed-call-prompt">Missed-call prompt (when no one answers the call)</h2>
        <p>
          Calls to the business are forwarded to the owner first. If no one answers, the line is busy, or
          the call fails, the caller hears this recorded prompt before any text is sent:
        </p>
        <pre>
          {`Sorry we missed your call to [Business]. This is Executive Receptionist. Would you like one text message about this call, so you can reply with what you need? Message and data rates may apply. Reply STOP to opt out, or HELP for help. Press 1 or say yes to get the text. Press 2 or say no, or just hang up, and we will not text you.`}
        </pre>
        <p>
          The missed-call text is sent only after the caller presses 1 or says yes and that answer has been
          saved. Pressing 2, saying no, hanging up, or an unclear answer means no text.
        </p>

        <h2 id="sample-conversation">Sample conversation</h2>
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
        <p>After the caller says yes to Ava and the answer is saved, we may send this confirmation (for live client lines with texting turned on):</p>
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
          {`Executive Receptionist: You're booked with [Business] for [window]. The team will confirm before the visit. Msg & data rates may apply. Reply STOP to opt out, HELP for help.`}
        </pre>

        <h2 id="caller-opt-out">How a caller opts out or gets help after consent</h2>
        <p>
          A caller who agreed to texts on the call can opt out or get help by replying to any program
          text:
        </p>
        <ul className={styles.storeList}>
          <li>
            Reply <strong>STOP</strong> to opt out of further automated texts from this program. The
            caller receives one confirmation text, and no further missed-call or booking texts are sent
            to that number.
          </li>
          <li>
            Reply <strong>HELP</strong> for help. The help reply identifies the program and how to
            contact us.
          </li>
        </ul>
        <p>
          Message and data rates may apply. Carriers are not liable for delayed or undelivered messages.
          Help is also available at{' '}
          <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a> or (256) 595-3354.
        </p>

        <h2 id="how-consent-is-stored">How consent is recorded and stored</h2>
        <p>
          Every yes or no is saved as a consent record in our database before any text is sent. If the
          record cannot be saved, no text is sent. Each record includes:
        </p>
        <ul className={styles.storeList}>
          <li>
            <strong>Timestamp.</strong> The date and time the answer was saved.
          </li>
          <li>
            <strong>Phone number.</strong> The number the person called from, or the mobile number entered
            on the setup form.
          </li>
          <li>
            <strong>Call or conversation identifier.</strong> The phone carrier&apos;s call ID (Twilio call SID)
            and/or Ava&apos;s conversation ID, tying the record to that call.
          </li>
          <li>
            <strong>Method, answer, script version, and exact wording.</strong> Whether consent was given by
            voice (verbal), by keypad (pressing 1 or 2), or on the web form; the yes or no; the script
            version; and the full consent text the person heard or saw.
          </li>
          <li>
            <strong>Business.</strong> The client business the call was for, when known.
          </li>
        </ul>
        <p>
          <strong>Retention.</strong> Consent records are kept for at least four years after the last
          message sent to that number; we do not automatically delete them. Ava calls may be recorded
          and transcribed by our voice provider, and those recordings and transcripts are kept according
          to each agent&apos;s privacy settings (currently with no automatic deletion). The missed-call prompt
          is not recorded; the keypad press or spoken answer is saved in the consent record.
        </p>
        <p>
          We use that record only to send the texts the person agreed to and to show consent if asked.
          We do not sell, rent, or share mobile phone numbers or text-messaging opt-in data or consent
          with third parties or affiliates for marketing or promotional purposes. Mobile numbers are
          used only to deliver these texts through our messaging provider, Twilio, which processes them
          only to send the messages for us.
        </p>

        <h2 id="web-form-opt-in">Full view of the website form opt-in</h2>
        <p>
          A business owner can also agree in writing on the Executive Receptionist setup form (the form
          shown after checkout, at <Link href="/onboarding/ava">/onboarding/ava</Link>). The live form
          itself sits behind checkout, so the complete opt-in is shown here on this public page, with no
          login. The view below is a static example of that form. The fields are disabled and empty.
          Nothing entered here is submitted or stored. The SMS checkbox starts unchecked, just as it
          does on the live form. Ticking it is optional and is not a condition of buying or using the
          service.
        </p>
        <div className={styles.formPreview}>
          <form aria-label="Static example of the Executive Receptionist setup form. This example does not submit.">
            <header className={styles.formPreviewHeader}>
              <h3>How should Executive Receptionist handle your calls?</h3>
              <p>Short answers are fine. Cole will confirm the details during your live test.</p>
            </header>

            <fieldset>
              <legend>Business</legend>
              <div className={styles.formPreviewRow}>
                <label>
                  Business name
                  <input type="text" autoComplete="off" disabled />
                </label>
                <label>
                  Hours
                  <input type="text" placeholder="Mon–Fri, 7am–5pm CT" disabled />
                </label>
              </div>
              <label>
                Services
                <textarea placeholder="HVAC repair and installation in Birmingham" disabled />
              </label>
            </fieldset>

            <fieldset>
              <legend>Call flow</legend>
              <label>
                What should Executive Receptionist do?
                <textarea placeholder="Ask what they need, collect their name and number, and send you the lead." disabled />
              </label>
              <label>
                What counts as urgent?
                <textarea placeholder="No heat is urgent. Call Sam; if no answer, text him and tell the caller we will respond in 15 minutes." disabled />
              </label>
            </fieldset>

            <fieldset>
              <legend>How customers reach you</legend>
              <p className={styles.formPreviewNotice}>
                Pick any combination. Same greeting and rules on every channel you turn on. Texting is
                available after setup — we will not send customer texts until then.
              </p>
              <label className={styles.formPreviewCheckbox}>
                <input type="checkbox" defaultChecked disabled aria-label="Voice calls, checked by default on the live form" />
                <span>
                  <strong>Voice calls</strong> — answer the phone when callers ring (Cole attaches your
                  number and you test one live call first).
                </span>
              </label>
              <label className={styles.formPreviewCheckbox}>
                <input type="checkbox" disabled aria-label="Website chat box, unchecked by default" />
                <span>
                  <strong>Website chat box</strong> — paste a chat widget on your site. Callers can talk
                  or type in the browser.
                </span>
              </label>
              <label className={styles.formPreviewCheckbox}>
                <input type="checkbox" disabled aria-label="Texting channel, unchecked by default" />
                <span>
                  <strong>Texting (available after setup)</strong> — missed-call text-back and reply
                  forwarding. Stored when you check this; sending stays off until setup is complete.
                </span>
              </label>
            </fieldset>

            <fieldset>
              <legend>Staff contact</legend>
              <div className={styles.formPreviewRow}>
                <label>
                  Name
                  <input type="text" autoComplete="off" disabled />
                </label>
                <label>
                  Phone for lead texts
                  <input type="tel" placeholder="(205) 555-0123" disabled />
                </label>
              </div>
              <label>
                Email for lead alerts
                <input type="email" placeholder="sam@example.com" disabled />
              </label>
              <label className={styles.formPreviewCheckbox}>
                <input
                  type="checkbox"
                  disabled
                  defaultChecked={false}
                  aria-label="Example SMS opt-in checkbox, unchecked"
                />
                <span>
                  {consentLead}See our <Link href="/privacy">Privacy Policy</Link> and{' '}
                  <Link href="/terms">Terms</Link>.
                </span>
              </label>
              <p className={styles.formPreviewNotice}>
                Add a phone, an email, or both. Lead emails go to the email address. Lead texts go to the
                phone only if you tick the box above.
              </p>
            </fieldset>

            <button type="button" className={styles.formPreviewButton} disabled>
              Send Setup Details
            </button>
          </form>
        </div>
        <p className={styles.optinCaption}>
          Full view of the setup form opt-in, including the Staff contact fields and the SMS checkbox.
          The box starts unchecked. Nothing is agreed to until the owner ticks that box and submits the
          live form with a mobile number. The &quot;Voice calls&quot; and &quot;Texting (available after
          setup)&quot; boxes above are channel choices, not SMS consent. Only the box with the
          message-frequency, rates, STOP/HELP, and &quot;not a condition of purchase&quot; language is
          the written opt-in.
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
        <p>When the setup form is submitted with the box ticked, we keep a consent record with:</p>
        <ul className={styles.storeList}>
          <li>
            <strong>Owner number.</strong> The mobile number entered on the form (the number that would
            be texted).
          </li>
          <li>
            <strong>Timestamp.</strong> The date and time the owner agreed.
          </li>
          <li>
            <strong>Exact wording and source.</strong> The consent language shown on the form (the text
            beside the checkbox above) and the page URL.
          </li>
          <li>
            <strong>Submission record.</strong> The IP address the form was submitted from.
          </li>
        </ul>
        <p>
          We use that record only to send the lead-alert texts the owner agreed to and to show consent
          if asked. We do not sell, rent, or share mobile phone numbers or text-messaging opt-in data or
          consent with third parties or affiliates for marketing or promotional purposes. Mobile numbers
          are used only to deliver these texts through our messaging provider, Twilio, which processes
          them only to send the messages for us.
        </p>

        <h2 id="owner-operator-opt-out">How a business owner or operator opts out</h2>
        <p>
          This is separate from caller opt-out. It covers lead-alert texts to a subscribing business
          owner or designated staff, and any operator (Cole Collins / Executive Receptionist) alerts to
          an internal number.
        </p>
        <ul className={styles.storeList}>
          <li>
            <strong>Business owner or designated staff</strong> who opted in on the setup form: reply{' '}
            <strong>STOP</strong> to any lead-alert text. One automatic confirmation text is sent, and
            no further lead texts are sent to that number. Lead alerts continue by email. Reply{' '}
            <strong>START</strong> to turn lead texts back on. Reply <strong>HELP</strong> for help.
            The owner can also email{' '}
            <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a> or call (256) 595-3354
            and ask to be removed from lead texts.
          </li>
          <li>
            <strong>Operator</strong> (Cole Collins or Executive Receptionist staff receiving internal
            alerts on an operator number): the same <strong>STOP</strong>, <strong>HELP</strong>, and{' '}
            <strong>START</strong> keywords work on that number. Operator texts are off unless the
            operator has explicitly opted in. The operator can also turn those alerts off by asking
            that the operator opt-in be removed, or by emailing{' '}
            <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a>.
          </li>
        </ul>
        <p>
          Message and data rates may apply. Carriers are not liable for delayed or undelivered messages.
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
