import type { Metadata } from 'next';
import Link from 'next/link';
import { ExclusiveAudio } from '@/components/receptionist/ExclusiveAudio';
import { VoicePicker } from '@/components/receptionist/VoicePicker';
import { OfferPricingLayout } from '@/components/ava/OfferPricingLayout';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { EXAMPLE_NOTES, EXECUTIVE_FAQS, EXECUTIVE_INDUSTRIES } from '@/lib/executive-receptionist';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { EXECUTIVE_RECEPTIONIST_ORIGIN } from '@/lib/site-url';
import { FaceToFaceWidget } from '@/components/receptionist/live/FaceToFaceWidget';
import { liveWidgetEnabled, realFaceEnabled } from '@/lib/live-receptionist/config';
import styles from './receptionist.module.css';

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
      'AI phone receptionist that answers inbound calls, takes the caller name, number and job, and emails a summary to the business.',
    brand: { '@type': 'Brand', name: 'Front Porch Growth' },
    offers: [
      {
        '@type': 'Offer',
        name: 'Executive Receptionist, $25 per booked job after a free 14-day pilot',
        price: '25.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://executivereceptionist.com/pricing',
        description: AVA_OFFER.summary,
      },
    ],
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
  'Free 14-day pilot',
  '$0 until the first booked job',
  '$25 per booked job, capped at $297/month',
  'Try the live demo before you pay',
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
        <a href={AVA_OFFER.demoUrl} target="_blank" rel="noopener noreferrer">
          Try the live demo
        </a>
      </nav>

      <section className={styles.hero}>
        <p className={styles.kicker}>For HVAC and plumbing shops that cannot leave the line unanswered</p>
        <h1>You stay on the job. The phone is already answered.</h1>
        <p className={styles.lede}>
          Executive Receptionist is the AI phone receptionist built first for HVAC and plumbing companies.
          It greets the caller in a voice you choose, takes the name, number, and what the job is, and emails
          you the summary so you can call back and book the work.
        </p>
        <div className={styles.heroActions}>
          <a className={styles.gold} href={AVA_OFFER.demoUrl} target="_blank" rel="noopener noreferrer">
            Try the live demo
          </a>
          <a className={styles.quiet} href="#voices">
            Hear the voices
          </a>
        </div>
        <p className={styles.fine}>
          The browser demo talks as a sample HVAC company. Ask about a no-cool call, a tune-up, or a plumbing
          leak and hear how it takes the details. It is a sample, not your business line.{' '}
          <Link href="/receptionist-demo#live-demo">Open the longer demo page</Link>.
        </p>
        <ul className={styles.trust} aria-label="What you can check before you buy">
          {trustPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section className={styles.band} id="industries">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>The trades</p>
          <h2>Built first for HVAC and plumbing, when both hands are already on a repair.</h2>
          <p>The same inbound answering can be written for other kinds of offices after that. The clips below are samples, not customer results.</p>
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
        <OfferPricingLayout variant="section" showTopbar={false} />
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
          <a className={styles.gold} href={AVA_OFFER.demoUrl} target="_blank" rel="noopener noreferrer">
            Try the live demo
          </a>
          <a className={styles.quiet} href={`mailto:${AVA_OFFER.contactEmail}?subject=${encodeURIComponent('Start an Executive Receptionist pilot')}`}>
            Ask Cole about a pilot
          </a>
        </div>
        <p className={styles.fine}>
          {AVA_OFFER.footerLine}. Part of <Link href="/">Front Porch Growth</Link>. Questions:{' '}
          <a href={`mailto:${AVA_OFFER.contactEmail}`}>{AVA_OFFER.contactEmail}</a>
        </p>
      </section>

      <a className={styles.callBar} href={AVA_OFFER.demoUrl} target="_blank" rel="noopener noreferrer">
        Try the live demo
      </a>
      {liveWidgetEnabled() ? <FaceToFaceWidget realFace={realFaceEnabled()} /> : null}
    </main>
  );
}
