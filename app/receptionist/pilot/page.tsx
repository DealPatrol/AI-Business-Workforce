import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import {
  PILOT_MONTHLY_CAP_CENTS,
  PILOT_PLANS,
  PILOT_PLAN_KEYS,
  PILOT_SALE_CENTS,
  PILOT_TRIAL_DAYS,
} from '@/lib/ava/pilot-pricing';
import styles from '../receptionist.module.css';

const SALE = `$${PILOT_SALE_CENTS / 100}`;
const CAP = `$${PILOT_MONTHLY_CAP_CENTS / 100}`;

// Unlisted offer page: shared by link, kept out of search and the sitemap.
export const metadata: Metadata = {
  title: { absolute: 'AI Receptionist Pilot | Pay Per Booked Job' },
  description: `Try the AI Receptionist free for ${PILOT_TRIAL_DAYS} days. Then a low monthly fee plus ${SALE} for each job you book, capped at ${CAP} a month.`,
  robots: { index: false, follow: false },
  alternates: { canonical: '/receptionist/pilot' },
};

const STEPS = [
  `Start your ${PILOT_TRIAL_DAYS}-day free trial. A card is required, and nothing is charged until the trial ends.`,
  'The receptionist answers your calls and emails you each lead with the caller, the job, and the address.',
  `When you book a job from a lead, tap “Mark as booked job” in that email. That adds ${SALE} to your next invoice.`,
];

export default function ReceptionistPilotPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/receptionist">Executive Receptionist</Link>
      </nav>

      <section className={styles.hero}>
        <p className={styles.kicker}>Pilot offer</p>
        <h1>Pay a small monthly fee, plus {SALE} only when a call becomes a booked job.</h1>
        <p className={styles.lede}>
          {PILOT_TRIAL_DAYS} days free. Then a flat monthly base by call volume, plus {SALE} for each job you
          book from a lead the receptionist captured. Your total bill never goes above {CAP} a month.
        </p>
        <ol>
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className={styles.band} id="pricing">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>Choose your call volume</p>
          <h2>
            Free for {PILOT_TRIAL_DAYS} days, then base + {SALE} per booked job, {CAP} maximum.
          </h2>
        </div>
        <div className={styles.plans}>
          {PILOT_PLAN_KEYS.map((key) => {
            const plan = PILOT_PLANS[key];
            const sellsToCap = Math.floor((PILOT_MONTHLY_CAP_CENTS - plan.baseCents) / PILOT_SALE_CENTS);
            return (
              <article key={key} className={key === 'pilot_147' ? styles.planFeatured : undefined}>
                <h3>{plan.label}</h3>
                <p className={styles.price}>
                  <strong>{plan.baseLabel}</strong>
                  <span>/month + {SALE} per booked job</span>
                </p>
                <p className={styles.minutes}>{plan.callVolume}</p>
                <ul>
                  <li>{PILOT_TRIAL_DAYS} days free, card required</li>
                  <li>Lead emailed to you after every call</li>
                  <li>
                    The {sellsToCap}th booked job in a month reaches the {CAP} cap; after that, more jobs are free
                  </li>
                </ul>
                <CheckoutForm href={`/api/checkout/pilot?plan=${key}`} action="/api/checkout/pilot">
                  Start {PILOT_TRIAL_DAYS}-day free trial
                </CheckoutForm>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.band} id="faq">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>Plain answers</p>
          <h2>How the {SALE} works.</h2>
        </div>
        <div className={styles.faq}>
          <details>
            <summary>How do you know a job was booked?</summary>
            <p>
              You tell us. Every lead email has a “Mark as booked job” button. Opening it shows what you are
              confirming; nothing is recorded until you press the confirm button on that page. Each lead can be
              marked once, so a double click never charges twice.
            </p>
          </details>
          <details>
            <summary>Am I charged during the free trial?</summary>
            <p>
              No. Jobs you mark during the {PILOT_TRIAL_DAYS}-day trial are recorded but cost nothing. Your card is
              kept on file and the monthly base starts when the trial ends.
            </p>
          </details>
          <details>
            <summary>What is the most I can pay?</summary>
            <p>
              {CAP} per month, base fee included. Once the base plus booked-job charges reach {CAP}, further jobs
              that month add nothing.
            </p>
          </details>
          <details>
            <summary>When do booked-job charges appear?</summary>
            <p>
              On your next monthly invoice, as a separate line for each job. You can cancel anytime; there is no
              long-term contract.
            </p>
          </details>
        </div>
      </section>
    </main>
  );
}
