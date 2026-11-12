import type { ReactNode } from 'react';
import Link from 'next/link';
import { AVA_OFFER, AVA_PLANS } from '@/lib/ava/pricing';
import { MonthlyPlans, PlanCheckoutButton } from '@/components/ava/MonthlyPlans';
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
      { feature: 'Starter: 100 minutes a month', value: '$79/mo (first month $1)', included: true },
      { feature: 'Growth: 300 minutes a month', value: '$197/mo', included: true },
      { feature: 'Pro: 1,200 minutes a month (best value)', value: '$397/mo', included: true },
      { feature: 'Elite: 2,000 minutes a month, priority setup', value: '$789/mo', included: true },
      { feature: 'Contract', value: 'Month to month', included: true },
    ],
  },
  {
    heading: 'What this does not do yet',
    rows: [
      { feature: 'Booking without your hours set up in the Desk', value: 'Not until set up', included: false },
      { feature: 'CRM sync', value: 'Not included', included: false },
      { feature: 'Text messages to you or the caller', value: 'Not included yet', included: false },
      { feature: 'Outbound calling', value: 'Not included', included: false },
    ],
  },
];

const BILLING_STEPS = [
  {
    title: 'Pick a plan',
    detail: `Choose your minutes. Starter's first month is ${AVA_PLANS.starter.firstMonthLabel}, then ${AVA_PLANS.starter.monthlyLabel}/month. Growth, Pro and Elite are billed at their monthly price from the first month.`,
  },
  {
    title: 'Set up your line',
    detail:
      'Cole writes the greeting and questions for your shop, and you forward your calls to Ava. Setup is included on every plan.',
  },
  {
    title: 'Ava answers',
    detail:
      'She answers your inbound calls around the clock, captures the caller’s details and the job, and emails you each summary.',
  },
  {
    title: 'Renews monthly',
    detail: `Your plan renews each month at its listed price until you cancel. ${AVA_OFFER.overageNote}`,
  },
];

const FAQS = [
  {
    q: 'What does each plan cost?',
    a: 'Starter is $79/month with 100 minutes, and your first month is $1. Growth is $197/month with 300 minutes. Pro is $397/month with 1,200 minutes. Elite is $789/month with 2,000 minutes and priority setup.',
  },
  {
    q: 'Is there a free trial?',
    a: 'No. Starter’s first month is $1, then $79/month. Growth, Pro and Elite are charged their full monthly price from the first month.',
  },
  {
    q: 'What counts as a minute?',
    a: 'Minutes are the time Ava spends on calls she answers for you. Every plan includes the same receptionist; plans differ by how many minutes are included each month.',
  },
  {
    q: 'What if I run past my minutes?',
    a: AVA_OFFER.overageNote,
  },
  {
    q: 'Do I have to sign a long contract?',
    a: 'No. Every plan is month to month and renews automatically. Cancel anytime.',
  },
  {
    q: 'Does it book the appointment on my calendar?',
    a: 'Once your hours are set up in your Desk, Ava can offer open times and put the visit on your Desk calendar. Until then, she captures the lead and emails you the summary, and you call the customer back. It does not sync to a CRM.',
  },
  {
    q: 'Will it text me or text the caller?',
    a: 'Not yet. Lead summaries go out by email. Texting is not part of the plans until messaging registration is finished.',
  },
  {
    q: 'How do I hear it before I buy?',
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
          <Link className={styles.brand} href="/receptionist">
            Executive Receptionist
          </Link>
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
        <h1>{isPage ? 'Your 24/7 front desk. Four simple monthly plans.' : 'Four plans. Pick your minutes.'}</h1>
        <p className={styles.lede}>
          Executive Receptionist answers the inbound calls you cannot pick up, 24 hours a day. It writes down the
          caller’s details and the job, then emails you the summary. If you turn on booking, it offers the open windows
          from the hours you set and puts the visit on your desk calendar. It does not pretend to be a person.
        </p>
        <div className={styles.heroActions}>
          <DemoLink className={styles.primary}>Try the live demo</DemoLink>
          <PlanCheckoutButton plan="starter" className={styles.secondary}>Start Starter for $1</PlanCheckoutButton>
        </div>
        <p className={styles.fine}>
          {AVA_OFFER.starterIntro} Prefer to talk it through? Call{' '}
          <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>.
        </p>
      </section>

      <section className={styles.plans} style={{ display: 'block' }}>
        <MonthlyPlans />
      </section>

      <p className={styles.underPlans}>
        Want a walk-through of how forwarding and the greeting will work in your shop?{' '}
        <a href={AVA_OFFER.contactPhoneHref}>Call Cole at {AVA_OFFER.contactPhoneDisplay}</a>
        {' or '}
        <a href={`mailto:${AVA_OFFER.contactEmail}`}>{AVA_OFFER.contactEmail}</a>.
        {AVA_OFFER.renewalNote}
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

      <section className={styles.features} id="features">
        <p className={styles.kicker}>A closer look at what is included</p>
        <h2>Everything included, written out so you can audit it.</h2>
        {FEATURE_GROUPS.map((group) => (
          <div key={group.heading} className={styles.tableBlock}>
            <h3>{group.heading}</h3>
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Plans</th>
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
            Built by Cole Collins, who also runs Collins Lawncare. Cole sets up the greeting himself so it matches
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
            <h2>Try the demo, then pick your plan.</h2>
            <div className={styles.heroActions}>
              <DemoLink className={styles.primary}>Try the live demo</DemoLink>
              <PlanCheckoutButton plan="pro" className={styles.secondary}>Get Pro, best value</PlanCheckoutButton>
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
