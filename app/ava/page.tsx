import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import localFont from 'next/font/local';
import SalesAvaQualify from '@/components/SalesAvaQualify';
import { AvaFooter } from '@/components/ava/AvaFooter';
import { JsonLd } from '@/components/ava/JsonLd';
import { SampleCall } from '@/components/ava/SampleCall';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { AVA_HOME_FAQS } from '@/lib/ava/home-faq';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { MonthlyPlans } from '@/components/ava/MonthlyPlans';
import { avaProductNode, avaServiceNode, avaSoftwareNode, faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { LIVE_DEMO_URL } from '@/lib/ava/demo-phone';
import { AVA_GUIDES } from '@/lib/ava/trade-pages';
import { urlsForRequest } from '@/lib/seo/host-metadata';
import { absoluteSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const published = absoluteSiteUrl('/ava');
  const { canonical, openGraphUrl } = await urlsForRequest('/ava', published, published);
  return {
    alternates: { canonical },
    openGraph: { images: ['/og-default.png'], url: openGraphUrl },
  };
}

// Self-hosted (latin subset, SIL OFL) so the build never depends on fetching
// from Google Fonts: a failed fetch there broke the Vercel build.
const display = localFont({
  src: [
    { path: './fonts/Fraunces-latin-normal.woff2', weight: '400 700', style: 'normal' },
    { path: './fonts/Fraunces-latin-italic.woff2', weight: '400 700', style: 'italic' },
  ],
  variable: '--ava-display',
  display: 'swap',
});

const mono = localFont({
  src: [
    { path: './fonts/IBMPlexMono-400-latin.woff2', weight: '400', style: 'normal' },
    { path: './fonts/IBMPlexMono-500-latin.woff2', weight: '500', style: 'normal' },
    { path: './fonts/IBMPlexMono-600-latin.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--ava-mono',
  display: 'swap',
});

const tradeGuides = AVA_GUIDES.filter((guide) => guide.kind === 'trade');
const buyerGuides = AVA_GUIDES.filter((guide) => guide.kind !== 'trade');

const callLog = [
  { time: '7:42 PM', from: 'Homeowner · Cullman', note: '“No cool — house is 88 degrees”' },
  { time: '8:03 PM', from: 'Homeowner · Decatur', note: '“Water heater leaking in the garage”' },
  { time: '8:31 PM', from: 'New customer · Huntsville', note: '“Need an estimate on a new unit”' },
  { time: '9:12 PM', from: 'Homeowner · Hanceville', note: '“Drain backing up into the tub”' },
  { time: '9:47 PM', from: 'Homeowner · Madison', note: '“Storm took shingles off the roof”' },
];

const SETUP_CALL_URL = process.env.NEXT_PUBLIC_AVA_SETUP_BOOKING_URL || '';

type AvaPageProps = {
  searchParams: Promise<{ checkout?: string | string[] }>;
};

export default async function AvaPage({ searchParams }: AvaPageProps) {
  const checkoutParam = (await searchParams).checkout;
  const checkoutUnavailable =
    (Array.isArray(checkoutParam) ? checkoutParam[0] : checkoutParam) === 'unavailable';
  const heroNext = SETUP_CALL_URL
    ? 'She’ll ask the setup questions. After that you can request a short setup call with Cole, or pick a plan.'
    : 'She’ll ask the setup questions, then you can pick a plan with answers prefilled.';
  const canonical = absoluteSiteUrl('/ava');
  const structuredData = jsonLdGraph([
    avaSoftwareNode({
      description:
        'AI receptionist that answers calls and website chat for contractors and small businesses, qualifies the lead, and emails the owner.',
      url: canonical,
    }),
    avaServiceNode({
      name: 'Executive Receptionist AI answering service',
      description:
        '24/7 call answering for home-service businesses and other small teams. Executive Receptionist captures the job and emails you the lead. Texting is available after setup.',
      url: canonical,
      audience: 'contractors and small businesses',
      serviceType: 'AI answering service',
    }),
    avaProductNode({
      name: 'Executive Receptionist AI Receptionist',
      description: `Self-serve AI receptionist. ${AVA_OFFER.summary}`,
      url: canonical,
    }),
    faqNode([...AVA_HOME_FAQS]),
  ]);

  return (
    <main className={`ava-redesign ${display.variable} ${mono.variable}`}>
      <JsonLd data={structuredData} />
      <div className="paper-grain" aria-hidden="true" />

      {/* ── Masthead ─────────────────────────────────────────── */}
      <header className="masthead">
        <Link className="wordmark" href="/ava">
          <span className="wordmark-ava">Executive Receptionist</span>
          <span className="wordmark-sub">by Front Porch Growth</span>
        </Link>
        <nav className="masthead-links">
          <Link href="/">Front Porch</Link>
          <a href="#talk-to-ava">Hear her</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Rate card</a>
        </nav>
        <TrackedCheckoutLink className="btn btn-ink" href="/api/checkout?plan=starter" plan="starter">
          Start for $1
        </TrackedCheckoutLink>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-main">
          <p className="stamp">AI receptionist · home services</p>
          <h1>
            Never miss <em>another</em> call.
          </h1>
          <p className="lede">
            Executive Receptionist answers your business line 24/7 in a friendly Southern voice — takes the caller&apos;s
            name, number, and what they need, then <strong>emails you the lead</strong>. {heroNext}
          </p>
          <div className="hero-ctas">
            <a className="btn btn-signal" href="#talk-to-ava">
              Talk to Executive Receptionist
            </a>
            <a className="btn btn-outline" href={LIVE_DEMO_URL} target="_blank" rel="noopener noreferrer">
              Try the live demo
            </a>
            <TrackedCheckoutLink className="btn btn-outline" href="/api/checkout?plan=starter" plan="starter">
              Start for $1 <ArrowRight size={17} />
            </TrackedCheckoutLink>
          </div>
          <SampleCall
            title="Hear a demo call"
            detail="Prerecorded landscaping estimate. Not a live customer."
            surface="ava-home"
          />
          <p className="hero-prices">
            <a href="#pricing">Starter $79/mo, first month $1</a>
            <span aria-hidden="true">·</span>
            Pro 1,200 minutes $397/mo
            <span aria-hidden="true">·</span>
            Month to month
          </p>
          <p className="hero-fine">{AVA_OFFER.starterIntro}</p>
        </div>

        <aside className="call-log" aria-label="Sample of calls Executive Receptionist answered tonight">
          <div className="call-log-head">
            <span className="live-dot" aria-hidden="true" />
            <span>Tonight on Executive Receptionist&apos;s line</span>
          </div>
          <ol>
            {callLog.map((call, i) => (
              <li key={call.time} style={{ animationDelay: `${0.35 + i * 0.45}s` }}>
                <span className="cl-time">{call.time}</span>
                <span className="cl-from">{call.from}</span>
                <span className="cl-note">{call.note}</span>
                <span className="cl-done">
                  <Check size={13} /> lead emailed
                </span>
              </li>
            ))}
          </ol>
          <p className="call-log-foot">Illustrated example. Not a live feed and not a performance claim.</p>
        </aside>
      </section>

      {/* ── Trades marquee ───────────────────────────────────── */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, dup) => (
            <span key={dup}>
              {['HVAC', 'Plumbing', 'Roofing', 'Landscaping', 'Electrical', 'Pest Control', 'Fencing', 'Concrete'].map(
                (trade) => (
                  <span className="marquee-item" key={`${dup}-${trade}`}>
                    {trade} <i>✳</i>
                  </span>
                ),
              )}
            </span>
          ))}
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how" className="how">
        <p className="section-kicker">From missed call to money</p>
        <h2>
          The front desk, <em>handled.</em>
        </h2>
        <div className="how-grid">
          <article>
            <span className="how-num">01</span>
            <h3>The phone rings</h3>
            <p>Executive Receptionist picks up on the first ring — 24/7, including nights, weekends, and when you&apos;re up a ladder.</p>
          </article>
          <article>
            <span className="how-num">02</span>
            <h3>She works the call</h3>
            <p>A friendly Southern voice collects the caller&apos;s name, number, and what they need — the way you&apos;d train her yourself.</p>
          </article>
          <article>
            <span className="how-num">03</span>
            <h3>You get the text</h3>
            <p>Seconds later the qualified lead lands on your phone. You call back the winners, not the tire-kickers.</p>
          </article>
        </div>
      </section>

      {/* ── Demo ─────────────────────────────────────────────── */}
      <section className="demo-intro">
        <p className="section-kicker">Hear it yourself</p>
        <h2>
          Pick up the <em>phone.</em>
        </h2>
        <p className="demo-sub">
          Talk to Executive Receptionist right now — she&apos;ll qualify you the way she qualifies your customers. No signup, no
          credit card. If your mic is blocked, you can watch her handle a real call instead.
        </p>
      </section>

      <SalesAvaQualify />

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="ratecard">
        <p className="section-kicker">Executive Receptionist pricing · $0 setup</p>
        <h2>
          The <em>rate card.</em>
        </h2>
        <p className="ratecard-sub">{AVA_OFFER.summary}</p>
        {checkoutUnavailable && (
          <p className="ratecard-alert">
            Checkout couldn&apos;t open a Stripe payment page just now. Email colecollins763@gmail.com and Cole can
            start the plan with you directly.
          </p>
        )}
        <MonthlyPlans heading={false} />
        <p className="ratecard-fine">
          Special telephony or integration requirements are quoted before launch. Cancel anytime. $0 setup. {AVA_OFFER.overageNote}
        </p>
      </section>

      {/* ── Industries ───────────────────────────────────────── */}
      <section className="trades">
        <p className="section-kicker">Built around your trade</p>
        <h2>
          Fluent in <em>your</em> trade.
        </h2>
        <p className="trades-sub">
          Each page is the calls, the questions, and a missed-call example for that buyer. The live demo is the same Executive Receptionist.
        </p>
        <ul className="trades-list">
          {tradeGuides.map((guide) => (
            <li key={guide.slug}>
              <Link href={`/ava/${guide.slug}`}>
                <span className="trade-name">{guide.navLabel}</span>
                <span className="trade-desc">{guide.blurb}</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
        <h3 className="guides-label">Buyer guides</h3>
        <ul className="trades-list">
          {buyerGuides.map((guide) => (
            <li key={guide.slug}>
              <Link href={`/ava/${guide.slug}`}>
                <span className="trade-name">{guide.navLabel}</span>
                <span className="trade-desc">{guide.blurb}</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="paper-faq" id="faq">
        <p className="section-kicker">Before you forward the line</p>
        <h2>
          Straight <em>answers.</em>
        </h2>
        {AVA_HOME_FAQS.map((faq) => (
          <details key={faq.q}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="finale">
        <p className="stamp stamp-light">Starter: first month $1 · $0 setup</p>
        <h2>
          Put Executive Receptionist on the <em>phones.</em>
        </h2>
        <p>
          Talk to her above, then pick a plan. Starter&apos;s first month is $1, then $79 a month. Pro gives you 1,200
          minutes for $397 a month, the best value per minute. Tomorrow&apos;s after-hours calls answer themselves.
        </p>
        <div className="hero-ctas">
          <TrackedCheckoutLink className="btn btn-paper" href="/api/checkout?plan=starter" plan="starter">
            Start for $1 <ArrowRight size={17} />
          </TrackedCheckoutLink>
          <a className="btn btn-ghostlight" href="#talk-to-ava">
            Talk to Executive Receptionist first
          </a>
        </div>
      </section>

      <AvaFooter />
    </main>
  );
}
