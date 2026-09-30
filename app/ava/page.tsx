import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ClipboardList,
  Headphones,
  PhoneCall,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import SalesAvaQualify from '@/components/SalesAvaQualify';
import { AvaFooter } from '@/components/ava/AvaFooter';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import {
  AVA_ASSISTED_LAUNCH,
  AVA_PLANS,
  avaPricingSummaryCopy,
  avaTrialThenPriceCopy,
  type AvaPlanKey,
} from '@/lib/ava/pricing';

const plans = (Object.keys(AVA_PLANS) as AvaPlanKey[]).map((key) => AVA_PLANS[key]);

const industryPages = [
  ['HVAC', '/ava/ai-receptionist-hvac-companies', 'No-cool, no-heat, maintenance, replacement and after-hours calls.'],
  ['Plumbing', '/ava/ai-receptionist-plumbers', 'Leaks, drains, water heaters and urgent plumbing intake.'],
  ['Roofing', '/ava/ai-receptionist-roofers', 'Storm, leak, inspection and replacement estimate calls.'],
  ['Electrical', '/ava/ai-answering-service-contractors', 'Outages, panel issues, and estimate routing with safety escalation.'],
  ['Landscaping', '/ava/ai-receptionist-landscapers', 'Mowing, cleanup and landscape project estimate leads.'],
  ['Missed Calls', '/ava/missed-call-answering-home-services', 'Overflow and after-hours coverage for home-service teams.'],
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
    <main className="ava-sales">
      <nav className="ava-nav">
        <Link className="ava-brand" href="/ava">
          <span>
            <Sparkles size={17} />
          </span>{' '}
          Ava
        </Link>
        <div>
          <a href="#talk-to-ava">Talk to Ava</a>
          <a href="#how">How It Works</a>
          <a href="#offer">What You Get</a>
          <a href="#pricing">Pricing</a>
        </div>
        <Link className="nav-cta" href="/onboarding/ava">
          Start free trial
        </Link>
      </nav>

      <section className="sales-hero">
        <div className="hero-copy">
          <span className="kicker">AVA · AI FRONT DESK FOR HOME SERVICES</span>
          <h1>
            Turn missed and after-hours calls into <em>qualified leads on your phone.</em>
          </h1>
          <p>
            Ava answers when you cannot, captures name, number, service, and urgency, then texts you
            the lead so you can book the job. Built for HVAC, plumbing, electrical, roofing, and
            other home-service shops that already buy demand and lose work to voicemail. {heroNext}
          </p>
          <div className="hero-actions">
            <a className="sales-btn" href="#talk-to-ava">
              <PhoneCall size={18} /> Talk to Ava
            </a>
            <Link className="sales-btn secondary" href="/onboarding/ava">
              Start free 7-day trial <ArrowRight size={18} />
            </Link>
          </div>
          <p className="trial-line">{avaTrialThenPriceCopy('starter')}</p>
          <div className="trust-row">
            <span>
              <Check /> Free 7-day trial
            </span>
            <span>
              <Check /> $0 setup on self-serve
            </span>
            <span>
              <Check /> Then from {AVA_PLANS.starter.monthlyLabel}/mo
            </span>
          </div>
        </div>
        <div className="hero-proof">
          <div className="proof-phone">
            <div className="phone-top">
              <span className="pulse" />
              <b>Incoming customer call</b>
              <small>7:42 PM</small>
            </div>
            <div className="call-path">
              <span>
                <PhoneCall /> Ava answers
              </span>
              <span>
                <Headphones /> Qualifies the job
              </span>
              <span>
                <ShieldCheck /> Texts you the lead
              </span>
            </div>
          </div>
        </div>
      </section>

      <SalesAvaQualify />

      <section id="how" className="how-section">
        <div className="section-title">
          <span className="kicker">FROM MISSED CALL TO A LEAD YOU CAN WORK</span>
          <h2>Ava covers the front desk. You keep the relationship.</h2>
          <p>
            Sell recovered response coverage — not vague “AI automation.” Ava handles intake; you
            close the sale and decide pricing.
          </p>
        </div>
        <div className="steps-grid">
          <article>
            <span>01</span>
            <PhoneCall />
            <h3>Capture</h3>
            <p>Missed, overflow, and after-hours calls land with Ava instead of voicemail.</p>
          </article>
          <article>
            <span>02</span>
            <ClipboardList />
            <h3>Qualify</h3>
            <p>She collects service, location cues, urgency, and callback details under your rules.</p>
          </article>
          <article>
            <span>03</span>
            <ShieldCheck />
            <h3>Handoff</h3>
            <p>You get a texted lead summary so a human can call back, book, or escalate.</p>
          </article>
        </div>
      </section>

      <section id="offer" className="bad-options">
        <div className="section-title">
          <span className="kicker">CLEAR SCOPE</span>
          <h2>What Ava does — and what stays human.</h2>
          <p>
            No invented revenue claims. Ava promises coverage, intake, and lead handoff. Bookings,
            quotes, and exceptions stay with your team.
          </p>
        </div>
        <div className="options-grid">
          <article>
            <span>01</span>
            <PhoneCall />
            <h3>Automated</h3>
            <p>24/7 answer, FAQ handling, lead fields, urgency flags, and owner text alerts.</p>
          </article>
          <article>
            <span>02</span>
            <Headphones />
            <h3>Human</h3>
            <p>Final sales calls, firm pricing, complaints, emergencies, and refunds.</p>
          </article>
          <article>
            <span>03</span>
            <ShieldCheck />
            <h3>Boundaries</h3>
            <p>No medical, legal, or emergency-dispatch niches. Safety keywords escalate to you.</p>
          </article>
        </div>
      </section>

      <section id="industries" className="bad-options">
        <div className="section-title">
          <span className="kicker">BUILT AROUND YOUR TRADE</span>
          <h2>See how Ava handles calls in your industry.</h2>
          <p>Each trade has different urgency and intake questions. These guides show the call flow Ava can support.</p>
        </div>
        <div className="options-grid">
          {industryPages.map(([name, href, desc], i) => (
            <article key={href}>
              <span>0{i + 1}</span>
              <PhoneCall />
              <h3>{name}</h3>
              <p>{desc}</p>
              <Link href={href}>
                See {name} call flow <ArrowRight />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="pricing">
        <div className="section-title">
          <span className="kicker">AVA PRICING · SELF-SERVE</span>
          <h2>Credible coverage pricing — not agency retainers.</h2>
          <p>
            {avaPricingSummaryCopy()} Optional assisted launch is {AVA_ASSISTED_LAUNCH.oneTimeLabel}{' '}
            one-time if you want Cole’s help before you forward the line.
          </p>
          {checkoutUnavailable && (
            <p className="usage-note">
              Checkout could not open a Stripe payment page. Email colecollins763@gmail.com and Cole can start the plan
              with you.
            </p>
          )}
        </div>
        <p className="trial-note">{avaTrialThenPriceCopy('starter')}</p>
        <div className="plan-grid">
          {plans.map((plan) => (
            <article className={plan.featured ? 'plan featured' : 'plan'} key={plan.key}>
              {plan.featured && <span className="popular">MOST POPULAR</span>}
              <h3>{plan.label}</h3>
              <p>{plan.description}</p>
              <div className="price">
                <strong>{plan.monthlyLabel}</strong>
                <span>/month</span>
              </div>
              <small>{plan.minutes} voice minutes / month</small>
              <small>{plan.overageLabel}</small>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link className="plan-btn" href={`/onboarding/ava?plan=${plan.key}`}>
                Start free 7-day trial
              </Link>
              <TrackedCheckoutLink className="plan-checkout" href={`/api/checkout?plan=${plan.key}`} plan={plan.key}>
                Checkout {plan.label}
              </TrackedCheckoutLink>
            </article>
          ))}
        </div>
        <p className="usage-note">
          Included minutes reset monthly. Usage above the included allowance is billed at the plan&apos;s published
          per-minute overage rate. {AVA_ASSISTED_LAUNCH.description} Special telephony or integration requirements are
          quoted before launch. This is self-serve receptionist software — not a $1,250/mo managed agency desk.
        </p>
      </section>

      <section className="final-cta">
        <span className="kicker">FREE 7-DAY TRIAL</span>
        <h2>Talk to Ava, then start coverage.</h2>
        <p>
          {avaTrialThenPriceCopy('starter')} She answers 24/7, qualifies the caller, and texts you the lead.
        </p>
        <div>
          <Link className="sales-btn light" href="/onboarding/ava">
            Start free 7-day trial
          </Link>
          <a className="sales-btn outline" href="#talk-to-ava">
            Talk to Ava
          </a>
        </div>
      </section>
      <AvaFooter />
    </main>
  );
}
