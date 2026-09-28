import Link from 'next/link';
import { ArrowRight, Check, Headphones, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import SalesAvaQualify from '@/components/SalesAvaQualify';
import { AvaFooter } from '@/components/ava/AvaFooter';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';

const plans = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$59',
    minutes: '250 voice minutes / month',
    overage: '$0.25/min after included usage',
    description: 'For smaller service businesses that want affordable 24/7 call coverage.',
    features: [
      'Ava AI receptionist',
      '24/7 answering',
      'Lead qualification + summaries',
      'Lead texts to your phone',
      'Business-specific greeting & FAQs',
    ],
    featured: false,
  },
  {
    key: 'growth',
    name: 'Growth',
    price: '$129',
    minutes: '650 voice minutes / month',
    overage: '$0.22/min after included usage',
    description: 'For businesses that depend on steady inbound calls and estimates.',
    features: [
      'Everything in Starter',
      'More custom call flows',
      'Multiple service types',
      'Advanced lead qualification',
      'Advanced routing',
    ],
    featured: true,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$249',
    minutes: '1,300 voice minutes / month',
    overage: '$0.20/min after included usage',
    description: 'For higher-volume teams that want a deeply customized front desk.',
    features: [
      'Everything in Growth',
      'Multiple call experiences',
      'Advanced routing logic',
      'Priority customization',
      'Deeper business configuration',
    ],
    featured: false,
  },
];

const industryPages = [
  ['HVAC', '/ava/ai-receptionist-hvac-companies', 'No-cool, no-heat, maintenance, replacement and after-hours calls.'],
  ['Plumbing', '/ava/ai-receptionist-plumbers', 'Leaks, drains, water heaters and urgent plumbing intake.'],
  ['Roofing', '/ava/ai-receptionist-roofers', 'Storm, leak, inspection and replacement estimate calls.'],
  ['Landscaping', '/ava/ai-receptionist-landscapers', 'Mowing, cleanup and landscape project estimate leads.'],
  ['Contractors', '/ava/ai-answering-service-contractors', 'General home-service answering and qualification.'],
  ['Missed Calls', '/ava/missed-call-answering-home-services', 'Overflow and after-hours coverage for home-service teams.'],
];

const SETUP_CALL_URL = process.env.NEXT_PUBLIC_AVA_SETUP_BOOKING_URL || '';

export default function AvaPage() {
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
          Workforce AI
        </Link>
        <div>
          <a href="#talk-to-ava">Talk to Ava</a>
          <a href="#how">How It Works</a>
          <a href="#industries">Industries</a>
          <a href="#pricing">Pricing</a>
        </div>
        <Link className="nav-cta" href="/onboarding/ava">
          Start free trial
        </Link>
      </nav>

      <section className="sales-hero">
        <div className="hero-copy">
          <span className="kicker">AI RECEPTIONIST FOR HOME SERVICES</span>
          <h1>
            Ava answers your calls 24/7 and <em>texts you the lead.</em>
          </h1>
          <p>
            A friendly Southern voice picks up, collects the caller’s name, number, and what they need, then texts
            that lead to you. {heroNext}
          </p>
          <div className="hero-actions">
            <a className="sales-btn" href="#talk-to-ava">
              <PhoneCall size={18} /> Talk to Ava
            </a>
            <Link className="sales-btn secondary" href="/onboarding/ava">
              Start free 7-day trial <ArrowRight size={18} />
            </Link>
          </div>
          <p className="trial-line">Free 7-day trial, then $59/mo. $0 setup.</p>
          <div className="trust-row">
            <span>
              <Check /> Free 7-day trial
            </span>
            <span>
              <Check /> $0 setup fee
            </span>
            <span>
              <Check /> Then $59/mo
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
                <Headphones /> Takes the caller’s details
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
          <span className="kicker">FROM MISSED CALL TO A LEAD ON YOUR PHONE</span>
          <h2>Ava handles the front desk while you handle the work.</h2>
        </div>
        <div className="steps-grid">
          <article>
            <span>01</span>
            <PhoneCall />
            <h3>Customer calls</h3>
            <p>Ava answers 24/7, including after-hours and overflow.</p>
          </article>
          <article>
            <span>02</span>
            <Headphones />
            <h3>Ava takes the details</h3>
            <p>She collects the caller’s name, number, and what they need.</p>
          </article>
          <article>
            <span>03</span>
            <ShieldCheck />
            <h3>You get a text</h3>
            <p>Ava texts that lead to you so you can call them back.</p>
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
          <span className="kicker">AVA PRICING · $0 SETUP</span>
          <h2>Choose the call coverage that fits your business.</h2>
          <p>Free 7-day trial, then $59/mo. $0 setup. Growth is $129 and Pro is $249, with the same $0 setup.</p>
        </div>
        <p className="trial-note">Free 7-day trial, then $59/mo. $0 setup.</p>
        <div className="plan-grid">
          {plans.map((plan) => (
            <article className={plan.featured ? 'plan featured' : 'plan'} key={plan.key}>
              {plan.featured && <span className="popular">MOST POPULAR</span>}
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <div className="price">
                <strong>{plan.price}</strong>
                <span>/month</span>
              </div>
              <small>{plan.minutes}</small>
              <small>{plan.overage}</small>
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
                Checkout {plan.name}
              </TrackedCheckoutLink>
            </article>
          ))}
        </div>
        <p className="usage-note">
          Included minutes reset monthly. Usage above the included allowance is billed at the plan&apos;s published
          per-minute overage rate. Special telephony or integration requirements are quoted before launch.
        </p>
      </section>

      <section className="final-cta">
        <span className="kicker">FREE 7-DAY TRIAL</span>
        <h2>Talk to Ava, then start the trial.</h2>
        <p>Free 7-day trial, then $59/mo. $0 setup. She answers 24/7 and texts you the lead.</p>
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
