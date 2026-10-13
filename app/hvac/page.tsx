import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Phone, MessageSquare, PhoneCall } from 'lucide-react';
import HvacContactForm from './contact-form';
import './hvac.css';

const DEMO_LINK = 'https://elevenlabs.io/app/talk-to?agent_id=agent_0301m4sb6c5sfdqrkthv80xt7na6';
const COLE_TEL = 'tel:+12565953354';
const COLE_SMS = 'sms:+12565953354';

export const metadata: Metadata = {
  title: 'Ava for HVAC | Never Miss a No-Heat or No-Cool Call | Front Porch Growth',
  description:
    'Ava answers your HVAC calls 24/7, takes the details on no-heat and no-cool emergencies, books tune-ups, and texts you a summary. Built for north Alabama heating and air shops. 30-day free trial.',
  alternates: { canonical: '/hvac' },
  openGraph: {
    title: 'Ava for HVAC: Never Miss Another Call',
    description:
      'An AI receptionist for heating and air shops. Catches after-hours and overflow calls, sends urgent ones to your on-call tech. 30-day free trial.',
    url: '/hvac',
    siteName: 'Front Porch Growth',
    type: 'website',
  },
};

const plans = [
  {
    name: 'Never Miss a Call',
    setup: '$297',
    monthly: '$297',
    minutes: '~300 min',
    features: [
      'Ava answers after-hours and overflow calls',
      'Missed-call text-back',
      'Call summaries texted to you',
      'Urgent calls sent to your on-call phone',
    ],
  },
  {
    name: 'Booked & Reviewed',
    setup: '$497',
    monthly: '$497',
    minutes: '~600 min',
    featured: true,
    features: [
      'Everything in Never Miss a Call',
      'Books jobs on your calendar',
      'Automatic Google review requests',
      'Monthly call report',
    ],
  },
  {
    name: 'Front Porch Complete',
    setup: '$1,497',
    monthly: '$797',
    minutes: '~1,200 min',
    features: [
      'Everything in Booked & Reviewed',
      'Simple website for your shop',
      'Google Business Profile cleanup',
      'Seasonal tune-up reminder texts',
    ],
  },
];

export default function HvacPage() {
  return (
    <main className="hvac-page">
      <nav className="hvac-nav">
        <Link href="/" className="hvac-brand">
          Front Porch Growth
        </Link>
        <div>
          <a href="#plans">Plans</a>
          <a href="#contact">Contact</a>
          <a className="hvac-nav-call" href={COLE_TEL}>
            <Phone size={16} /> 256-595-3354
          </a>
        </div>
      </nav>

      <section className="hvac-hero">
        <p className="hvac-eyebrow">For north Alabama heating &amp; air shops</p>
        <h1>Never miss another no-heat call.</h1>
        <p className="hvac-lede">
          When it&apos;s 28 degrees out and the furnace quits, folks call the next company on the list
          if nobody picks up. Ava answers every call, day or night, gets the name, address, and
          what&apos;s wrong, and sends the urgent ones straight to your on-call tech.
        </p>
        <div className="hvac-cta-row">
          <a className="hvac-btn hvac-btn-primary" href={DEMO_LINK} target="_blank" rel="noopener noreferrer">
            <PhoneCall size={18} /> Talk to Ava now
          </a>
          <a className="hvac-btn hvac-btn-ghost" href={COLE_TEL}>
            <Phone size={18} /> Call Cole
          </a>
          <a className="hvac-btn hvac-btn-ghost" href={COLE_SMS}>
            <MessageSquare size={18} /> Text Cole
          </a>
        </div>
        <p className="hvac-small">
          The demo plays Ava answering for &quot;Front Porch Heating &amp; Air,&quot; a made-up shop.
          Try a no-heat emergency, a tune-up, or ask what a new unit costs. Works in your browser; allow
          the microphone.
        </p>
      </section>

      <section className="hvac-stats">
        <div>
          <strong>27%</strong>
          <span>of calls to home-service businesses go unanswered.</span>
          <a href="https://www.invoca.com/blog/how-much-missed-sales-calls-cost-home-services-businesses" target="_blank" rel="noopener noreferrer">
            Source: Invoca
          </a>
        </div>
        <div>
          <strong>$385</strong>
          <span>average HVAC service repair ticket.</span>
          <a href="https://servicegrid.app/blog/average-ticket-by-trade-2026" target="_blank" rel="noopener noreferrer">
            Source: ServiceGrid
          </a>
        </div>
        <div>
          <strong>3 calls</strong>
          <span>
            caught a month at $385 is about $1,155 in repairs. That covers even the biggest plan.
          </span>
        </div>
      </section>

      <section className="hvac-how">
        <h2>What Ava does on your line</h2>
        <ul>
          <li>
            <Check size={18} /> <b>No heat / no cool:</b> takes name, address, callback number, the
            problem, and how urgent it is, then tells the caller a tech will call back shortly.
          </li>
          <li>
            <Check size={18} /> <b>Tune-ups and routine work:</b> collects the details and the times
            that suit them, so your office can confirm.
          </li>
          <li>
            <Check size={18} /> <b>Pricing questions:</b> gives only the diagnostic fee you set and
            never makes up a price. Everything else waits on your tech.
          </li>
          <li>
            <Check size={18} /> <b>After hours:</b> emergencies go to your on-call phone, everything
            else waits for the morning.
          </li>
          <li>
            <Check size={18} /> <b>Upset callers or billing issues:</b> takes a message and sends it to
            you or your manager.
          </li>
        </ul>
      </section>

      <section className="hvac-plans" id="plans">
        <h2>Plans</h2>
        <div className="hvac-plan-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={plan.featured ? 'hvac-plan featured' : 'hvac-plan'}>
              {plan.featured && <span className="hvac-badge">Most popular</span>}
              <h3>{plan.name}</h3>
              <p className="hvac-price">
                {plan.monthly}
                <small>/mo</small>
              </p>
              <p className="hvac-setup">{plan.setup} one-time setup</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} /> {feature}
                  </li>
                ))}
                <li className="hvac-minutes">Includes {plan.minutes} of calls (estimated)</li>
              </ul>
            </article>
          ))}
        </div>
        <div className="hvac-trial">
          <h3>30-day free trial</h3>
          <p>
            If Ava doesn&apos;t catch at least 3 calls you would have missed in the first 30 days, you
            pay nothing. Month-to-month after that, no contract, and you keep your phone number.
          </p>
          <p>
            <b>Founding offer:</b> the first 10 shops get the setup fee waived and their monthly price
            locked for 12 months.
          </p>
        </div>
      </section>

      <section className="hvac-contact" id="contact">
        <div>
          <h2>Talk to a real person</h2>
          <p>
            I&apos;m Cole Collins, based in Hanceville. Call or text me at{' '}
            <a href={COLE_TEL}>256-595-3354</a> and I&apos;ll set Ava up on your line myself, or leave
            your info here and I&apos;ll call you back.
          </p>
          <a className="hvac-btn hvac-btn-primary" href={DEMO_LINK} target="_blank" rel="noopener noreferrer">
            <PhoneCall size={18} /> Talk to Ava now
          </a>
        </div>
        <HvacContactForm />
      </section>

      <footer className="hvac-footer">
        <span>Front Porch Growth, Hanceville, AL</span>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>
    </main>
  );
}
