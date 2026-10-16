import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';

const CHECKOUT_URL = 'https://buy.stripe.com/cNi9ATaHAeX5fdrfakebu02';
const title = 'Missed-Call Text-Back, $39/month | Front Porch Growth';
const description =
  'When you miss a call, the caller gets a text from your business within seconds, so the job does not go to the next name on Google. $39 a month, cancel anytime.';

const FAQS = [
  { q: 'Do I need a new phone number?', a: 'No. You keep your number. We set up conditional forwarding so only calls you do not answer go to the text-back line. Customers still call the same number they always have.' },
  { q: 'What does the text say?', a: 'Something like: "Hey, this is Mike with Ace Lawn. Sorry we missed you, we are on a job. What can we help with?" We write it with you and you can change it anytime.' },
  { q: 'How fast is setup?', a: 'Usually within 1 business day of checkout. Cole texts you, you dial one forwarding code from your phone, and we place a test call together.' },
  { q: 'How is this different from Executive Receptionist?', a: 'Text-back sends a text. Executive Receptionist answers the call with a voice receptionist, books the job, and sends you the details. Text-back is the entry tier; you can upgrade anytime.' },
  { q: 'Can I cancel?', a: 'Yes. It is month to month with no contract.' },
] as const;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/missed-call' },
  openGraph: { title, description, url: '/missed-call', siteName: 'Front Porch Growth', type: 'website' },
};

export default function MissedCallPage() {
  return (
    <SuiteShell>
      <section className={styles.section}>
        <span className={styles.eyebrow}>MISSED-CALL TEXT-BACK</span>
        <h1>Missed the call? They get a text before they call your competitor.</h1>
        <p>
          You are on a roof, under a sink, or behind a mower. The phone rings and you cannot grab it. Most callers will not leave a voicemail. They call the next company. Text-back sends them a friendly text from your business right away, so the conversation keeps going and you can reply when your hands are free.
        </p>
        <div className={styles.grid}>
          <article className={styles.card}>
            <h2>How it works</h2>
            <p>1. A call to your business number goes unanswered.</p>
            <p>2. The caller gets a text from your business within seconds.</p>
            <p>3. Their reply lands with you, and you pick up the job.</p>
          </article>
          <article className={styles.card}>
            <h2>Missed-Call Text-Back</h2>
            <p>Keep your number. Custom message. Setup done for you. Month to month.</p>
            <p className={styles.price}>$39/month</p>
            <a className={styles.button} href={CHECKOUT_URL}>
              Start text-back
            </a>
          </article>
        </div>
        <p>
          Want the call answered, not just texted? <Link href="/receptionist">Executive Receptionist</Link> answers with a voice receptionist and books the job. Plans are $77, $168, and $324 a month.
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
