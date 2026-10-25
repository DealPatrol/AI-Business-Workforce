import type { Metadata } from 'next';
import Link from 'next/link';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { ExclusiveAudio } from '@/components/receptionist/ExclusiveAudio';
import { VoicePicker } from '@/components/receptionist/VoicePicker';
import { LIVE_DEMO_PHONE_DISPLAY, LIVE_DEMO_PHONE_HREF } from '@/lib/ava/demo-phone';
import { AVA_PLANS, type AvaPlanKey } from '@/lib/ava/pricing';
import { EXAMPLE_NOTES, EXECUTIVE_FAQS, EXECUTIVE_INDUSTRIES } from '@/lib/executive-receptionist';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { EXECUTIVE_RECEPTIONIST_ORIGIN } from '@/lib/site-url';
import { FaceToFaceWidget } from '@/components/receptionist/live/FaceToFaceWidget';
import { liveWidgetEnabled } from '@/lib/live-receptionist/config';
import styles from './receptionist.module.css';

const plans = (Object.keys(AVA_PLANS) as AvaPlanKey[]).map((key) => AVA_PLANS[key]);

const seo = pageSeo('/receptionist');
const title = renderedTitle(seo);
const description = seo.description;
const canonical = `${EXECUTIVE_RECEPTIONIST_ORIGIN}/`;

// Structured data built only from published plan data and on-page FAQs (no ratings or review counts).
const structured = [
  {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Executive Receptionist',
    description:
      'AI phone receptionist that answers calls, takes the caller name, number and reason, and texts the lead to the business.',
    brand: { '@type': 'Brand', name: 'Front Porch Growth' },
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.productName,
      price: (plan.monthlyCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: 'https://frontporchgrowth.com/receptionist#pricing',
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: EXECUTIVE_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  },
];

const trustPoints = [
  'Prices published below',
  '7-day free trial',
  '$0 setup',
  'Cancel anytime',
  'Call the demo line before you pay',
];


export async function generateMetadata(): Promise<Metadata> {
  return {
    title: metadataTitle(seo),
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Executive Receptionist',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default function ReceptionistPage() {
  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }}
      />
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
          <a className={styles.gold} href={LIVE_DEMO_PHONE_HREF} aria-label={`Call the live demo at ${LIVE_DEMO_PHONE_DISPLAY}`}>
            Call the live demo · {LIVE_DEMO_PHONE_DISPLAY}
          </a>
          <a className={styles.quiet} href="#voices">
            Hear the voices
          </a>
        </div>
        <p className={styles.fine}>
          The demo line answers as a sample HVAC company, Front Porch Heating &amp; Air. Ask about a broken AC,
          a tune-up, or a price and hear how it handles you. No phone handy?{' '}
          <Link href="/receptionist-demo#live-demo">Try it in your browser</Link>.
        </p>
        <ul className={styles.trust} aria-label="What you can check before you buy">
          {trustPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
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
        <div className={styles.heroActions}>
          <TrackedCheckoutLink className={styles.gold} href="/api/checkout?plan=growth" plan="growth">
            Start the Growth trial
          </TrackedCheckoutLink>
          <a className={styles.quiet} href={LIVE_DEMO_PHONE_HREF}>
            Call the demo first
          </a>
        </div>
        <p className={styles.fine}>
          Part of <Link href="/">Front Porch Growth</Link>. Questions:{' '}
          <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a>
        </p>
      </section>

      <a className={styles.callBar} href={LIVE_DEMO_PHONE_HREF}>
        Call the live demo · {LIVE_DEMO_PHONE_DISPLAY}
      </a>
      {liveWidgetEnabled() ? <FaceToFaceWidget /> : null}
    </main>
  );
}
