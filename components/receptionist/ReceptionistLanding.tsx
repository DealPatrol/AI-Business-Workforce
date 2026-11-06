import Link from 'next/link';
import { Suspense } from 'react';
import { ExclusiveAudio } from '@/components/receptionist/ExclusiveAudio';
import { VoicePicker } from '@/components/receptionist/VoicePicker';
import { OfferPricingLayout } from '@/components/ava/OfferPricingLayout';
import { IndustryDemo } from '@/components/receptionist/IndustryDemo';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { EXAMPLE_NOTES, EXECUTIVE_FAQS, EXECUTIVE_INDUSTRIES } from '@/lib/executive-receptionist';
import { ER_DEMO_NICHES, type ErDemoNiche } from '@/lib/er-demos';
import { liveWidgetEnabled, realFaceEnabled } from '@/lib/live-receptionist/config';
import { FaceToFaceWidget } from '@/components/receptionist/live/FaceToFaceWidget';
import styles from '@/app/receptionist/receptionist.module.css';

const trustPoints = [
  'Prices published below',
  'Free 14-day pilot',
  '$0 until the first booked job',
  '$25 per booked job, capped at $297/month',
  'Try the live demo before you pay',
];

const defaultHero = {
  kicker: 'For HVAC, plumbing, and other home-service shops that cannot leave the line unanswered',
  headline: 'You stay on the job. The phone is already answered.',
  lede: 'Executive Receptionist is the AI phone receptionist built first for HVAC and plumbing companies, with matching demos for roofing, electrical, and auto repair. It greets the caller in a voice you choose, takes the name, number, and what the job is, and emails you the summary so you can call back and book the work.',
};

type Props = {
  niche?: ErDemoNiche;
};

export function ReceptionistLanding({ niche }: Props) {
  const isNiche = Boolean(niche);
  const kicker = niche?.heroKicker ?? defaultHero.kicker;
  const headline = niche?.heroHeadline ?? defaultHero.headline;
  const lede = niche?.heroLede ?? defaultHero.lede;

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/receptionist">Executive Receptionist</Link>
        <div>
          <a href="#demo">Demo</a>
          <a href="#industries">Trades</a>
          <a href="#voices">Voices</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <a href="#demo">Try the live demo</a>
      </nav>

      <section className={styles.hero}>
        <p className={styles.kicker}>{kicker}</p>
        <h1>{headline}</h1>
        <p className={styles.lede}>{lede}</p>
        <div className={styles.heroActions}>
          <a className={styles.gold} href="#demo">
            {niche ? niche.talkLabel.replace(' now', '') : 'Hear the demo'}
          </a>
          <a className={styles.quiet} href="#pricing">
            See the offer
          </a>
        </div>
        <p className={styles.fine}>
          {isNiche
            ? `This page is for ${niche!.name.toLowerCase()} shops. Play the sample call, then talk to ${niche!.company} in your browser. It is a fictional demo shop, not a real dispatch line. Your browser will ask for microphone permission.`
            : 'Pick your trade below, play a sample call, then talk to that receptionist in your browser. Each demo is a fictional shop, not your business line. Your browser will ask for microphone permission.'}{' '}
          Prefer to talk it through? Call{' '}
          <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>.
        </p>
        <ul className={styles.trust} aria-label="What you can check before you buy">
          {trustPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section className={styles.band} id="demo">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>Industry demos</p>
          <h2>Hear a sample call, then talk to the receptionist for that trade.</h2>
          <p>
            Facebook ads can send each trade to its own page. The button starts a live browser call — no extra phone
            number. Allow your microphone when asked. If you ask whether this is a demo, the receptionist will say so.
          </p>
        </div>
        <Suspense fallback={<p className={styles.fine}>Loading the demo…</p>}>
          <IndustryDemo initialSlug={niche?.slug} />
        </Suspense>
      </section>

      <section className={styles.band} id="industries">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>The trades</p>
          <h2>Built first for HVAC and plumbing, with matching demos for other home services.</h2>
          <p>
            Wave 1 is HVAC and plumbing. Roofing, electrical, and auto repair demos are here so owners in those trades
            can hear their own call flow. Dental, med spa, and law remain on hold. The extra voice clips further down
            are samples, not customer results.
          </p>
        </div>
        <ul className={styles.industryGrid}>
          {ER_DEMO_NICHES.map((industry) => (
            <li key={industry.slug}>
              <h3>
                <Link href={`/receptionist/${industry.slug}`}>{industry.name}</Link>
              </h3>
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
          <p className={styles.kicker}>More voice samples</p>
          <h2>Extra office scripts, not the launch offer.</h2>
          <p>
            These clips show other office scripts in Madison’s voice. Wave 1 is HVAC and plumbing; dental, med spa, and
            law are on hold. These are not recordings of real clients. The caller’s lines are pauses.
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
          <a className={styles.gold} href="#demo">
            Try the live demo
          </a>
          <a
            className={styles.quiet}
            href={`mailto:${AVA_OFFER.contactEmail}?subject=${encodeURIComponent('Start an Executive Receptionist pilot')}`}
          >
            Ask Cole about a pilot
          </a>
        </div>
        <p className={styles.fine}>
          {AVA_OFFER.summary} {AVA_OFFER.guarantee} Call{' '}
          <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>.
        </p>
        <p className={styles.fine}>
          {AVA_OFFER.footerLine}. Part of <Link href="/">Front Porch Growth</Link>. Questions:{' '}
          <a href={`mailto:${AVA_OFFER.contactEmail}`}>{AVA_OFFER.contactEmail}</a>
        </p>
      </section>

      <a className={styles.callBar} href="#demo">
        Try the live demo
      </a>
      {liveWidgetEnabled() ? <FaceToFaceWidget realFace={realFaceEnabled()} /> : null}
    </main>
  );
}
