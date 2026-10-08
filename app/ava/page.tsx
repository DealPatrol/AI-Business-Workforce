import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { Fraunces, IBM_Plex_Mono } from 'next/font/google';
import SalesAvaQualify from '@/components/SalesAvaQualify';
import { AvaFooter } from '@/components/ava/AvaFooter';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { AVA_PLANS, avaTrialThenPriceCopy, type AvaPlanKey } from '@/lib/ava/pricing';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--ava-display',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--ava-mono',
  display: 'swap',
});

const plans = (Object.keys(AVA_PLANS) as AvaPlanKey[]).map((key) => AVA_PLANS[key]);

const industryPages = [
  ['HVAC', '/ava/ai-receptionist-hvac-companies', 'No-cool, no-heat, maintenance, replacement and after-hours calls.'],
  ['Plumbing', '/ava/ai-receptionist-plumbers', 'Leaks, drains, water heaters and urgent plumbing intake.'],
  ['Roofing', '/ava/ai-receptionist-roofers', 'Storm, leak, inspection and replacement estimate calls.'],
  ['Landscaping', '/ava/ai-receptionist-landscapers', 'Mowing, cleanup and landscape project estimate leads.'],
  ['Contractors', '/ava/ai-answering-service-contractors', 'General home-service answering and qualification.'],
  ['Missed Calls', '/ava/missed-call-answering-home-services', 'Overflow and after-hours coverage for home-service teams.'],
];

const callLog = [
  { time: '7:42 PM', from: '(205) 555-0143', note: '“No cool — house is 88 degrees”' },
  { time: '8:03 PM', from: '(256) 555-0117', note: '“Water heater leaking in the garage”' },
  { time: '8:31 PM', from: '(205) 555-0192', note: '“Need an estimate on a new unit”' },
  { time: '9:12 PM', from: '(256) 555-0164', note: '“Drain backing up into the tub”' },
  { time: '9:47 PM', from: '(205) 555-0138', note: '“Storm took shingles off the roof”' },
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
    ? 'She’ll ask the setup questions. After that you can request a short setup call with Cole, or start the free trial.'
    : 'She’ll ask the setup questions, then you can start the free trial with answers prefilled.';

  return (
    <main className={`ava-redesign ${display.variable} ${mono.variable}`}>
      <div className="paper-grain" aria-hidden="true" />

      {/* ── Masthead ─────────────────────────────────────────── */}
      <header className="masthead">
        <Link className="wordmark" href="/ava">
          <span className="wordmark-ava">Ava</span>
          <span className="wordmark-sub">by Workforce AI</span>
        </Link>
        <nav className="masthead-links">
          <a href="#talk-to-ava">Hear her</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Rate card</a>
        </nav>
        <TrackedCheckoutLink className="btn btn-ink" href="/api/checkout?plan=starter" plan="starter">
          Start free trial
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
            Ava answers your business line 24/7 in a friendly Southern voice — takes the caller&apos;s
            name, number, and what they need, then <strong>texts you the lead</strong>. {heroNext}
          </p>
          <div className="hero-ctas">
            <a className="btn btn-signal" href="#talk-to-ava">
              Talk to Ava
            </a>
            <TrackedCheckoutLink className="btn btn-outline" href="/api/checkout?plan=starter" plan="starter">
              Start free 7-day trial <ArrowRight size={17} />
            </TrackedCheckoutLink>
          </div>
          <p className="hero-fine">{avaTrialThenPriceCopy('starter')} Cancel anytime.</p>
        </div>

        <aside className="call-log" aria-label="Sample of calls Ava answered tonight">
          <div className="call-log-head">
            <span className="live-dot" aria-hidden="true" />
            <span>Tonight on Ava&apos;s line</span>
          </div>
          <ol>
            {callLog.map((call, i) => (
              <li key={call.time} style={{ animationDelay: `${0.35 + i * 0.45}s` }}>
                <span className="cl-time">{call.time}</span>
                <span className="cl-from">{call.from}</span>
                <span className="cl-note">{call.note}</span>
                <span className="cl-done">
                  <Check size={13} /> lead texted
                </span>
              </li>
            ))}
          </ol>
          <p className="call-log-foot">5 after-hours calls · 0 missed · every lead on the owner&apos;s phone</p>
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
            <p>Ava picks up on the first ring — 24/7, including nights, weekends, and when you&apos;re up a ladder.</p>
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
        <p className="section-kicker">Don&apos;t take our word for it</p>
        <h2>
          Pick up the <em>phone.</em>
        </h2>
        <p className="demo-sub">
          Talk to Ava right now — she&apos;ll qualify you the way she qualifies your customers. No signup, no
          credit card. If your mic is blocked, you can watch her handle a real call instead.
        </p>
      </section>

      <SalesAvaQualify />

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="ratecard">
        <p className="section-kicker">Ava pricing · $0 setup</p>
        <h2>
          The <em>rate card.</em>
        </h2>
        <p className="ratecard-sub">
          Free 7-day trial on every plan. Included minutes reset monthly — overage is billed at the plan&apos;s
          published per-minute rate.
        </p>
        {checkoutUnavailable && (
          <p className="ratecard-alert">
            Checkout couldn&apos;t open a Stripe payment page just now. Email colecollins763@gmail.com and Cole can
            start the plan with you directly.
          </p>
        )}
        <div className="ratecard-list">
          {plans.map((plan) => (
            <article className={plan.featured ? 'plan featured' : 'plan'} key={plan.key}>
              <div className="plan-main">
                <div className="plan-head">
                  <h3>{plan.label}</h3>
                  {plan.featured && <span className="stamp-sm">Most booked</span>}
                </div>
                <p className="plan-desc">{plan.description}</p>
                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={14} /> {feature}
                    </li>
                  ))}
                </ul>
                <p className="plan-minutes">
                  {plan.minutes.toLocaleString('en-US')} voice minutes / month · {plan.overageLabel}
                </p>
              </div>
              <div className="plan-side">
                <p className="plan-price">
                  <strong>{plan.monthlyLabel}</strong>
                  <span>/mo</span>
                </p>
                <TrackedCheckoutLink className="btn btn-signal" href={`/api/checkout?plan=${plan.key}`} plan={plan.key}>
                  Start free trial
                </TrackedCheckoutLink>
                <TrackedCheckoutLink className="plan-direct" href={`/api/checkout?plan=${plan.key}`} plan={plan.key}>
                  or check out directly <ArrowUpRight size={13} />
                </TrackedCheckoutLink>
              </div>
            </article>
          ))}
        </div>
        <p className="ratecard-fine">
          Special telephony or integration requirements are quoted before launch. Cancel anytime. $0 setup.
        </p>
      </section>

      {/* ── Industries ───────────────────────────────────────── */}
      <section className="trades">
        <p className="section-kicker">Built around your trade</p>
        <h2>
          Fluent in <em>your</em> trade.
        </h2>
        <p className="trades-sub">
          Every trade has its own urgency and intake questions. These guides show the exact call flow Ava runs for yours.
        </p>
        <ul className="trades-list">
          {industryPages.map(([name, href, desc]) => (
            <li key={href}>
              <Link href={href}>
                <span className="trade-name">{name}</span>
                <span className="trade-desc">{desc}</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="finale">
        <p className="stamp stamp-light">Free 7-day trial · $0 setup</p>
        <h2>
          Put Ava on the <em>phones.</em>
        </h2>
        <p>
          Talk to her above, then start the trial. {AVA_PLANS.starter.monthlyLabel}, {AVA_PLANS.growth.monthlyLabel}, or{' '}
          {AVA_PLANS.pro.monthlyLabel} a month after the trial. Tomorrow&apos;s after-hours calls answer themselves.
        </p>
        <div className="hero-ctas">
          <TrackedCheckoutLink className="btn btn-paper" href="/api/checkout?plan=starter" plan="starter">
            Start free 7-day trial <ArrowRight size={17} />
          </TrackedCheckoutLink>
          <a className="btn btn-ghostlight" href="#talk-to-ava">
            Talk to Ava first
          </a>
        </div>
      </section>

      <AvaFooter />
    </main>
  );
}
