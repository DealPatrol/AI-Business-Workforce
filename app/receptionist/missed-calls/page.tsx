import type { Metadata } from 'next';
import Link from 'next/link';
import { TrialSignupLink } from '@/components/dispatch/TrialSignupLink';
import { MISSED_CALL_ADS, missedCallSeo, missedCallTrade } from '@/lib/dispatch/missed-call-ads';
import { AVA_OFFER, AVA_PLANS } from '@/lib/ava/pricing';
import { avaPlanOfferNodes, faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { urlsForRequest } from '@/lib/seo/host-metadata';
import { absoluteSiteUrl } from '@/lib/site-url';
import styles from './missed.module.css';

const FAQS = [
  {
    q: 'What does Executive Receptionist actually do on the call?',
    a: 'It answers calls that reach it, including after-hours and unanswered calls you forward. It asks for the caller’s name, number, and what they need, then emails that lead to you. It does not book the job on your calendar.',
  },
  {
    q: 'What does it cost to start?',
    a: `${AVA_OFFER.starterIntro} Bigger plans are $197, $397 and $789 a month and are billed at full price from the first month. Setup is done with you by Cole.`
  },
  {
    q: 'Does the browser demo become my business line?',
    a: 'No. Stripe starts your plan. A person attaches the phone number after setup. The sample call on the product page is prerecorded.',
  },
] as const;

type PageProps = {
  searchParams: Promise<{ trade?: string | string[] }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const raw = Array.isArray(params.trade) ? params.trade[0] : params.trade;
  const ad = MISSED_CALL_ADS[missedCallTrade(raw)];
  const seo = missedCallSeo(ad.trade);
  const title = seo.title;
  const description = seo.description;
  const { canonical, openGraphUrl } = await urlsForRequest('/receptionist/missed-calls', '/receptionist/missed-calls');
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: raw && raw !== 'hvac' ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { images: ['/og-default.png'], title, description, url: openGraphUrl, siteName: 'Front Porch Growth', type: 'website' },
  };
}

export default async function MissedCallsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.trade) ? params.trade[0] : params.trade;
  const ad = MISSED_CALL_ADS[missedCallTrade(raw)];
  const structured = jsonLdGraph([
    {
      '@type': 'SoftwareApplication',
      name: 'Executive Receptionist',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: absoluteSiteUrl('/receptionist/missed-calls'),
      description: 'AI receptionist that answers missed calls and emails the lead summary.',
      offers: avaPlanOfferNodes(absoluteSiteUrl('/receptionist/missed-calls')),
    },
    faqNode([...FAQS]),
  ]);

  return (
    <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <header className={styles.bar}>
        <Link href="/">Front Porch Growth</Link>
        <Link href="/receptionist">Product</Link>
      </header>
      <main className={styles.main}>
        <p className={styles.stamp}>{ad.label} · AFTER HOURS</p>
        <h1>{ad.hook}</h1>
        <p className={styles.morning}>{ad.morning}</p>
        <section className={styles.offer} aria-label="Price and trial">
          <p className={styles.price}>
            {AVA_PLANS.starter.firstMonthLabel}
            <span> first month on Starter, then {AVA_PLANS.starter.monthlyLabel}/month</span>
          </p>
          <TrialSignupLink className={styles.cta} href="/api/checkout?plan=starter" plan="starter">
            Start for $1
          </TrialSignupLink>
          <p className={styles.fine}>
            {AVA_OFFER.summary} The checkout is Stripe. This page does not start a charge by itself.
          </p>
        </section>
        <section className={styles.story}>
          <h2>The job you did not hear about.</h2>
          <p>{ad.stakes}</p>
          <p className={styles.fine}>{ad.stakesNote}</p>
        </section>
        <section className={styles.mechanism}>
          <h2>What Executive Receptionist does.</h2>
          <ul>
            <li>It answers the calls you send it, including nights and weekends.</li>
            <li>It takes the name, the number, and what is wrong.</li>
            <li>It emails you that lead so you can call back and book the job.</li>
          </ul>
          <p>
            It does not book the appointment on your calendar, and this page does not claim a pickup in under a minute. You still
            dispatch the truck.
          </p>
          <p>
            <Link className={styles.text} href="/receptionist">
              Hear the sample call and see the full rate card
            </Link>
          </p>
        </section>
        <p className={styles.note}>
          Plans are the same prices published on <Link href="/pricing">the pricing page</Link>. Checked against
          this site on October 13, 2026.
        </p>
      </main>
    </div>
  );
}
