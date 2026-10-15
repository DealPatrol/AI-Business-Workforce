import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Phone, MessageSquare, PhoneCall } from 'lucide-react';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { AVA_PLAN_KEYS, AVA_PLANS, avaTrialThenPriceCopy } from '@/lib/ava/pricing';
import HvacContactForm from './contact-form';
import './hvac.css';

const DEMO_LINK = 'https://elevenlabs.io/app/talk-to?agent_id=agent_0301m4sb6c5sfdqrkthv80xt7na6';
const COLE_TEL = 'tel:+12565953354';
const COLE_SMS = 'sms:+12565953354';

export const metadata: Metadata = {
  title: 'Executive Receptionist for HVAC | Never Miss a No-Heat or No-Cool Call | Front Porch Growth',
  description:
    'Executive Receptionist answers your HVAC calls 24/7, takes the details on no-heat and no-cool emergencies, and texts you a summary. Free 7-day trial, then $77, $168, or $324 a month. $0 setup.',
  alternates: { canonical: '/hvac' },
  openGraph: {
    title: 'Executive Receptionist for HVAC: Never Miss Another Call',
    description:
      'An AI receptionist for heating and air shops. Catches after-hours and overflow calls and sends urgent ones to your on-call tech. Free 7-day trial, $0 setup.',
    url: '/hvac',
    siteName: 'Front Porch Growth',
    type: 'website',
  },
};

const plans = AVA_PLAN_KEYS.map((key) => AVA_PLANS[key]);

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
          if nobody picks up. Executive Receptionist answers every call, day or night, gets the name, address, and
          what&apos;s wrong, and sends the urgent ones straight to your on-call tech.
        </p>
        <div className="hvac-cta-row">
          <a className="hvac-btn hvac-btn-primary" href={DEMO_LINK} target="_blank" rel="noopener noreferrer">
            <PhoneCall size={18} /> Talk to Executive Receptionist
          </a>
          <a className="hvac-btn hvac-btn-ghost" href={COLE_TEL}>
            <Phone size={18} /> Call Cole
          </a>
          <a className="hvac-btn hvac-btn-ghost" href={COLE_SMS}>
            <MessageSquare size={18} /> Text Cole
          </a>
        </div>
        <p className="hvac-small">
          The demo plays Executive Receptionist answering for &quot;Front Porch Heating &amp; Air,&quot; a made-up shop.
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
        <h2>What Executive Receptionist does on your line</h2>
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
            <article key={plan.key} className={plan.featured ? 'hvac-plan featured' : 'hvac-plan'}>
              {plan.featured && <span className="hvac-badge">Most popular</span>}
              <h3>{plan.label}</h3>
              <p className="hvac-price">
                {plan.monthlyLabel}
                <small>/mo</small>
              </p>
              <p className="hvac-setup">7-day free trial · $0 setup</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} /> {feature}
                  </li>
                ))}
                <li className="hvac-minutes">
                  {plan.minutes.toLocaleString('en-US')} voice minutes / month · {plan.overageLabel}
                </li>
              </ul>
              <TrackedCheckoutLink
                className="hvac-btn hvac-btn-primary"
                href={`/api/checkout?plan=${plan.key}`}
                plan={plan.key}
              >
                Start free trial
              </TrackedCheckoutLink>
            </article>
          ))}
        </div>
        <div className="hvac-trial">
          <h3>7-day free trial</h3>
          <p>
            {avaTrialThenPriceCopy('starter')} Cancel anytime. Included minutes reset monthly, and overage bills at
            the plan&apos;s published per-minute rate.
          </p>
          <p>
            Same terms as the Executive Receptionist rate card. Special telephony or integration requirements are
            quoted before launch. Month-to-month after the trial, and you keep your phone number.
          </p>
        </div>
      </section>

      <section className="hvac-contact" id="contact">
        <div>
          <h2>Talk to a real person</h2>
          <p>
            I&apos;m Cole Collins, based in Hanceville. Call or text me at{' '}
            <a href={COLE_TEL}>256-595-3354</a> and I&apos;ll set Executive Receptionist up on your line myself, or leave
            your info here and I&apos;ll call you back.
          </p>
          <a className="hvac-btn hvac-btn-primary" href={DEMO_LINK} target="_blank" rel="noopener noreferrer">
            <PhoneCall size={18} /> Talk to Executive Receptionist
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
