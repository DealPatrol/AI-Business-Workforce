import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { ExclusiveAudio } from '@/components/receptionist/ExclusiveAudio';
import { VoicePicker } from '@/components/receptionist/VoicePicker';
import { LIVE_DEMO_PHONE_DISPLAY, LIVE_DEMO_PHONE_HREF } from '@/lib/ava/demo-phone';
import { AVA_PLANS, type AvaPlanKey } from '@/lib/ava/pricing';
import { EXAMPLE_NOTES, EXECUTIVE_FAQS, EXECUTIVE_INDUSTRIES } from '@/lib/executive-receptionist';
import { hostnameOf, isExecutiveReceptionistHost } from '@/lib/site-url';
import styles from './receptionist.module.css';

const plans = (Object.keys(AVA_PLANS) as AvaPlanKey[]).map((key) => AVA_PLANS[key]);

const description =
  'Executive Receptionist answers the phone for dentists, law firms, med spas, CPAs, financial advisors, real estate, and chiropractors. Choose a voice, hear a sample call, and start a 7-day trial.';

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = hostnameOf(headerList.get('x-forwarded-host') || headerList.get('host'));
  const onBrand = isExecutiveReceptionistHost(host);
  const title = 'Executive Receptionist';
  return {
    title: { absolute: onBrand ? title : `${title} | Front Porch Growth` },
    description,
    alternates: { canonical: onBrand ? 'https://executivereceptionist.com/' : '/receptionist' },
    openGraph: {
      title,
      description,
      url: onBrand ? 'https://executivereceptionist.com/' : '/receptionist',
      siteName: onBrand ? title : 'Front Porch Growth',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default function ReceptionistPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/receptionist">Executive Receptionist</Link>
        <div>
          <a href="#industries">Practices</a>
          <a href="#voices">Voices</a>
          <a href="#samples">Sample calls</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <TrackedCheckoutLink href="/api/checkout?plan=growth" plan="growth">
          Begin
        </TrackedCheckoutLink>
      </nav>

      <section className={styles.hero}>
        <p className={styles.kicker}>For practices that cannot leave the line unanswered</p>
        <h1>The office stays with the client. The phone is already answered.</h1>
        <p className={styles.lede}>
          Executive Receptionist is the AI phone receptionist for dentists, law firms, med spas, and other
          high-ticket professional offices. It greets the caller in a voice you choose, takes the name and
          number, and texts you the lead.
        </p>
        <div className={styles.heroActions}>
          <a className={styles.gold} href="#voices">
            Hear the voices
          </a>
          <a className={styles.quiet} href="#pricing">
            View the rate card
          </a>
        </div>
        <p className={styles.fine}>
          Call the live demo:{' '}
          <a href={LIVE_DEMO_PHONE_HREF}>
            <strong>{LIVE_DEMO_PHONE_DISPLAY}</strong>
          </a>{' '}
          (answers as a sample home-service business) or try it in your browser at{' '}
          <Link href="/receptionist-demo#live-demo">the live demo</Link>.
        </p>
        <p className={styles.fine}>Free 7-day trial. $0 setup. Cancel anytime.</p>
      </section>

      <section className={styles.band} id="industries">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>The practices</p>
          <h2>Built for rooms where the person who should answer is already with someone.</h2>
        </div>
        <ul className={styles.industryGrid}>
          {EXECUTIVE_INDUSTRIES.map((industry) => (
            <li key={industry.slug}>
              <h3>{industry.name}</h3>
              <p>{industry.line}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.band} id="voices">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>The voice</p>
          <h2>Madison is the default. Five others are ready when you want a different room.</h2>
          <p>Each clip is the receptionist’s side of a sample call. The caller’s lines are pauses.</p>
        </div>
        <VoicePicker />
      </section>

      <section className={styles.band} id="samples">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>Sample calls</p>
          <h2>One recorded example for each kind of office.</h2>
          <p>
            Madison’s side of a scripted call, in the default voice. These are not recordings of real clients.
            The caller’s lines are pauses.
          </p>
        </div>
        <ul className={styles.sampleList}>
          {EXECUTIVE_INDUSTRIES.map((industry) => (
            <li key={industry.slug}>
              <div>
                <h3>{industry.name}</h3>
                <p>{industry.sample}</p>
              </div>
              <ExclusiveAudio src={`/voices/samples/${industry.slug}.mp3`}>{industry.name}</ExclusiveAudio>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.band} id="pricing">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>The rate card</p>
          <h2>Published monthly plans. A week to hear it on your calls.</h2>
        </div>
        <div className={styles.plans}>
          {plans.map((plan) => (
            <article key={plan.key} className={plan.featured ? styles.planFeatured : undefined}>
              <h3>{plan.label}</h3>
              <p className={styles.price}>
                <strong>{plan.monthlyLabel}</strong>
                <span>/month after trial</span>
              </p>
              <p>{plan.description}</p>
              <p className={styles.minutes}>
                {plan.minutes.toLocaleString('en-US')} minutes · {plan.overageLabel}
              </p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <TrackedCheckoutLink href={`/api/checkout?plan=${plan.key}`} plan={plan.key}>
                Start 7-day trial
              </TrackedCheckoutLink>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.band} id="examples">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>Example notes</p>
          <h2>Illustrations of the handoff. Not reviews from clients.</h2>
        </div>
        <ul className={styles.examples}>
          {EXAMPLE_NOTES.map((note) => (
            <li key={note.practice}>
              <span>Example</span>
              <blockquote>{note.quote}</blockquote>
              <p>{note.practice}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.band} id="faq">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>Before you forward the line</p>
          <h2>Plain answers.</h2>
        </div>
        <div className={styles.faq}>
          {EXECUTIVE_FAQS.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.closing}>
        <p className={styles.kicker}>The next call</p>
        <h2>Have it answered before it reaches voicemail.</h2>
        <TrackedCheckoutLink className={styles.gold} href="/api/checkout?plan=growth" plan="growth">
          Start the Growth trial
        </TrackedCheckoutLink>
        <p className={styles.fine}>
          Part of <Link href="/">Front Porch Growth</Link>. Questions:{' '}
          <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a>
        </p>
      </section>
    </main>
  );
}
