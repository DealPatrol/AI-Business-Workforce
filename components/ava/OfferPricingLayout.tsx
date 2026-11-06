import type { ReactNode } from 'react';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { BookedJobCalculator } from '@/components/ava/BookedJobCalculator';
import styles from './offer-pricing.module.css';

const FEATURE_GROUPS: Array<{
  heading: string;
  rows: Array<{ feature: string; value: string; included: boolean }>;
}> = [
  {
    heading: 'What the receptionist does',
    rows: [
      { feature: 'Answers inbound calls 24/7', value: 'Included', included: true },
      { feature: 'Takes the caller’s name, callback number, and what the job is', value: 'Included', included: true },
      { feature: 'Emails you a summary of the call', value: 'Included', included: true },
      { feature: 'Greeting and questions written for your trade', value: 'Included', included: true },
      { feature: 'Built first for HVAC and plumbing shops', value: 'Included', included: true },
      { feature: 'In-person setup in Gadsden, Alabama', value: 'Included', included: true },
    ],
  },
  {
    heading: 'How you are billed',
    rows: [
      { feature: 'Free 14-day pilot, with a card on file', value: 'Included', included: true },
      { feature: 'After the pilot, $0 until the first booked job', value: 'Included', included: true },
      { feature: '$25 per booked job after that', value: AVA_OFFER.perBookedJobLabel, included: true },
      { feature: 'Monthly cap', value: AVA_OFFER.monthlyCapLabel, included: true },
    ],
  },
  {
    heading: 'What this does not do yet',
    rows: [
      { feature: 'Live calendar booking', value: 'Not included', included: false },
      { feature: 'CRM sync', value: 'Not included', included: false },
      { feature: 'Text messages to you or the caller', value: 'Not included yet', included: false },
      { feature: 'Outbound calling', value: 'Not included', included: false },
    ],
  },
];

const BILLING_STEPS = [
  {
    title: 'Set up in person',
    detail:
      'Cole meets you in Gadsden, writes the greeting and questions for your shop, and puts a card on file. Nothing is charged to start the pilot.',
  },
  {
    title: 'Run the 14-day pilot',
    detail:
      'The receptionist answers your inbound calls around the clock, captures the caller’s details and the job, and emails you each summary.',
  },
  {
    title: 'Stay at $0 until work is booked',
    detail:
      'When the pilot ends you still pay nothing until a call it handled turns into a booked job.',
  },
  {
    title: 'Then $25 a job, never more than $297',
    detail: `After that first booked job, each booked job is ${AVA_OFFER.perBookedJobLabel}. The month stops at ${AVA_OFFER.monthlyCapLabel}, even if more jobs come in.`,
  },
];

const FAQS = [
  {
    q: 'What happens during the 14-day pilot?',
    a: 'The receptionist answers inbound calls on your line, takes the caller’s name, number, and what they need, and emails you the summary. A card stays on file. If it does not capture a single real caller lead during those 14 days, you pay nothing.',
  },
  {
    q: 'When do I start paying?',
    a: 'After the pilot you pay $0 until the first booked job. Then each booked job is $25, and the month never goes above $297.',
  },
  {
    q: 'What counts as a booked job?',
    a: 'A booked job is work you put on the calendar that started from a caller the receptionist already handled. Hang-ups, wrong numbers, and calls that do not become work are not billed as booked jobs.',
  },
  {
    q: 'Do I have to sign a long contract?',
    a: 'No. This is month-to-month after the pilot. Setup is in person in Gadsden so the greeting matches your shop; it is not a multi-year agreement.',
  },
  {
    q: 'Does it book the appointment on my calendar?',
    a: 'No. It captures the lead and emails you the summary. You call the customer back and book the job yourself. It does not sync to a CRM.',
  },
  {
    q: 'Will it text me or text the caller?',
    a: 'Not yet. Lead summaries go out by email. Texting is not part of this offer until messaging registration is finished.',
  },
  {
    q: 'Who is this for right now?',
    a: 'HVAC and plumbing shops first — the trades where a missed after-hours call is often a real repair. The same inbound answering can be written for other service businesses after that.',
  },
  {
    q: 'How do I hear it before we meet?',
    a: 'Use the live demo button on this page. It opens a browser conversation with the receptionist. That demo is a sample, not your business line.',
  },
];

function DemoLink({ className, children }: { className: string; children: ReactNode }) {
  return (
    <a className={className} href={AVA_OFFER.demoUrl} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function PilotLink({ className, children }: { className: string; children: ReactNode }) {
  return (
    <a className={className} href={`mailto:${AVA_OFFER.contactEmail}?subject=${encodeURIComponent('Start an Executive Receptionist pilot')}`}>
      {children}
    </a>
  );
}

export function OfferPricingLayout({
  variant = 'page',
  showTopbar,
  otherProducts,
}: {
  variant?: 'page' | 'section';
  showTopbar?: boolean;
  otherProducts?: ReactNode;
}) {
  const isPage = variant === 'page';
  const renderTopbar = showTopbar ?? isPage;

  return (
    <div className={`${styles.wrap} ${isPage ? styles.pageWrap : styles.sectionWrap}`}>
      {renderTopbar ? (
        <header className={styles.topbar}>
          <a className={styles.brand} href="/receptionist">
            Executive Receptionist
          </a>
          <nav aria-label="Pricing page">
            <a href="#plans">Plans</a>
            <a href="#features">Features</a>
            <a href="#faq">FAQ</a>
          </nav>
          <DemoLink className={styles.topCta}>Try the live demo</DemoLink>
        </header>
      ) : null}

      <section className={styles.hero} id={isPage ? 'top' : undefined}>
        <p className={styles.kicker}>For HVAC and plumbing shops that cannot miss the next repair call</p>
        <h1>{isPage ? 'Your after-hours front desk, priced on the jobs it helps you book.' : 'One published offer. No mystery tiers.'}</h1>
        <p className={styles.lede}>
          Executive Receptionist answers the inbound calls you cannot pick up, 24 hours a day. It writes down the
          caller’s details and the job, then emails you the summary so you can call back and book the work. It does
          not pretend to be a person, and it does not book the calendar for you.
        </p>
        <div className={styles.heroActions}>
          <DemoLink className={styles.primary}>Try the live demo</DemoLink>
          <PilotLink className={styles.secondary}>Ask Cole to start your 14-day pilot</PilotLink>
        </div>
        <p className={styles.fine}>
          {AVA_OFFER.summary} Prefer to talk it through? Call{' '}
          <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>.
        </p>
      </section>

      <section className={styles.plans} id="plans">
        <article className={styles.card}>
          <p className={styles.cardEyebrow}>Pilot</p>
          <h2>14 days to hear it on your line</h2>
          <p className={styles.price}>
            <strong>$0</strong>
            <span>during the pilot</span>
          </p>
          <p className={styles.cardPitch}>Card on file. Set up in person in {AVA_OFFER.setupCity}.</p>
          <ul>
            <li>Answers inbound calls day and night</li>
            <li>Captures the name, number, and job</li>
            <li>Emails you each summary</li>
            <li>{AVA_OFFER.guarantee}</li>
          </ul>
          <PilotLink className={styles.primary}>Start the conversation</PilotLink>
        </article>

        <article className={`${styles.card} ${styles.featured}`}>
          <p className={styles.cardEyebrow}>After the first booked job</p>
          <h2>Pay when the phone turns into work</h2>
          <p className={styles.price}>
            <strong>{AVA_OFFER.perBookedJobLabel}</strong>
            <span>per booked job</span>
          </p>
          <p className={styles.cardPitch}>
            $0 until that first booked job. Never more than {AVA_OFFER.monthlyCapLabel} in a month.
          </p>
          <ul>
            <li>Same 24/7 inbound answering</li>
            <li>Same emailed lead summaries</li>
            <li>Greeting written for HVAC or plumbing first</li>
            <li>Month-to-month after the pilot</li>
          </ul>
          <DemoLink className={styles.primary}>Hear it before you pay</DemoLink>
        </article>
      </section>

      <p className={styles.underPlans}>
        Want a walk-through of how forwarding and the greeting will work in your shop?{' '}
        <a href={AVA_OFFER.contactPhoneHref}>Call Cole at {AVA_OFFER.contactPhoneDisplay}</a>
        {' or '}
        <a href={`mailto:${AVA_OFFER.contactEmail}`}>{AVA_OFFER.contactEmail}</a>.
        Online checkout for the older monthly tiers is turned off until metered billing matches this offer.
      </p>

      <section className={styles.billing} id="billing">
        <p className={styles.kicker}>How billing works</p>
        <h2>Four steps, in the order they actually happen.</h2>
        <ol>
          {BILLING_STEPS.map((step, index) => (
            <li key={step.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <BookedJobCalculator />

      <aside className={styles.guarantee} id="guarantee">
        <p className={styles.kicker}>The pilot guarantee</p>
        <blockquote>{AVA_OFFER.guarantee}</blockquote>
        <p>
          That is the whole promise. It is not a claim about how many jobs a shop will book, and it is not a review from
          another customer.
        </p>
      </aside>

      <section className={styles.features} id="features">
        <p className={styles.kicker}>A closer look at what is included</p>
        <h2>One offer, written out so you can audit it.</h2>
        {FEATURE_GROUPS.map((group) => (
          <div key={group.heading} className={styles.tableBlock}>
            <h3>{group.heading}</h3>
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>This offer</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.feature}>
                    <td>{row.feature}</td>
                    <td data-included={row.included ? 'yes' : 'no'}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      <section className={styles.trust} id="trust">
        <p className={styles.kicker}>Who you are dealing with</p>
        <h2>A local shop owner, not a wall of unverified reviews.</h2>
        <ul>
          <li>
            Built by Cole Collins, who also runs Collins Lawncare. Setup is in person in Gadsden so the greeting matches
            how your HVAC or plumbing company actually talks.
          </li>
          <li>
            Callers are told they are speaking with an AI receptionist. The product is inbound-only: it answers, it
            captures the job, and it emails you.
          </li>
          <li>
            This page does not invent customer counts, star ratings, or testimonials. When there are results to show,
            they will be named and checkable.
          </li>
        </ul>
      </section>

      {isPage ? (
        <>
          <section className={styles.faq} id="faq">
            <p className={styles.kicker}>Frequently asked questions</p>
            <h2>Plain answers before you forward the line.</h2>
            {FAQS.map((faq) => (
              <details key={faq.q}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </section>

          {otherProducts}

          <section className={styles.closing} id="talk">
            <p className={styles.kicker}>Ready to hear it?</p>
            <h2>Try the demo, then set a time to put it on your line.</h2>
            <div className={styles.heroActions}>
              <DemoLink className={styles.primary}>Try the live demo</DemoLink>
              <PilotLink className={styles.secondary}>Email Cole about a pilot</PilotLink>
            </div>
          </section>

          <footer className={styles.footer}>
            <p>{AVA_OFFER.footerLine}</p>
            <p>
              <a href={`mailto:${AVA_OFFER.contactEmail}`}>{AVA_OFFER.contactEmail}</a>
              {' · '}
              <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>
            </p>
          </footer>
        </>
      ) : otherProducts}
    </div>
  );
}
