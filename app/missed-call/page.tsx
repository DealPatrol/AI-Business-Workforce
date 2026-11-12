import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';

const seo = pageSeo('/missed-call');
const title = renderedTitle(seo);
const description = seo.description;

const FAQS = [
  {
    q: 'Is this live today?',
    a: 'No. This page is a waitlist. Automatic missed-call texts cannot be sent until carrier verification is approved. Cole will email you when it can legally run.',
  },
  {
    q: 'Who will the text come from?',
    a: 'Executive Receptionist, on behalf of your business. The message will say Executive Receptionist and name your shop. It will not pretend to be a personal text from you.',
  },
  {
    q: 'Who would get a text?',
    a: 'Only people who called your business line and did not reach anyone. One transactional callback text per missed call. No marketing texts and no texts to purchased lists.',
  },
  {
    q: 'Do I need a new phone number?',
    a: 'No. You keep your number. When the program launches, unanswered calls can be forwarded so a missed caller can receive that one callback text.',
  },
  {
    q: 'How is this different from Executive Receptionist?',
    a: 'Text-back would send a text after an unanswered call. Executive Receptionist answers the call with a voice receptionist, captures the details, and emails you the summary. Text-back stays on the waitlist until carrier verification is approved.',
  },
] as const;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/missed-call' },
  openGraph: { images: ['/og-default.png'], title, description, url: '/missed-call', siteName: 'Front Porch Growth', type: 'website' },
};

export default function MissedCallPage() {
  return (
    <SuiteShell>
      <section className={styles.section}>
        <span className={styles.eyebrow}>WAITLIST</span>
        <h1>Missed-call text-back is on a waitlist.</h1>
        <p>
          This product is not live. After carrier texting verification is approved, Executive Receptionist will be able
          to send one transactional callback text, as Executive Receptionist on behalf of your business, to a person who
          called your line and did not reach anyone.
        </p>
        <div className={styles.grid}>
          <article className={styles.card}>
            <h2>How it is designed to work</h2>
            <p>1. Someone calls your published business number and no one answers.</p>
            <p>2. They may receive one text from Executive Receptionist on behalf of your business.</p>
            <p>3. They can reply or call back. Reply STOP to opt out, HELP for help.</p>
          </article>
          <article className={styles.card}>
            <h2>Join the waitlist</h2>
            <p>Planned price after launch: $39/month. There is no live checkout and no texts are being sent from this page.</p>
            <p>
              Service can start only after carrier registration is approved. Join the waitlist and Cole will email you when
              it can legally run.
            </p>
            <a className={styles.button} href={`mailto:colecollins763@gmail.com?subject=${encodeURIComponent('Missed-Call Text-Back waitlist')}`}>
              Join the waitlist
            </a>
          </article>
        </div>
        <p>
          SMS program details: <Link href="/sms">SMS terms</Link>. How we handle caller numbers:{' '}
          <Link href="/privacy">Privacy</Link>.
        </p>
        <p>
          Want the call answered, not just a later callback text? <Link href="/receptionist">Executive Receptionist</Link>{' '}
          answers with a voice receptionist and emails you the summary. Pricing: plans from $79 a month; Starter’s first
          month is $1.
        </p>
        <section className={styles.faq}>
          {FAQS.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </section>
      </section>
    </SuiteShell>
  );
}
