import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Phone, PhoneCall, Snowflake, Flame, Moon } from 'lucide-react';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { urlsForRequest } from '@/lib/seo/host-metadata';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import HvacContactForm from './contact-form';
import './hvac.css';

const seo = pageSeo('/hvac');
const title = renderedTitle(seo);

/** Gadsden HVAC demo agent (same one AVA_OFFER.demoUrl points to). */
const DEMO_LINK = AVA_OFFER.demoUrl;

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { canonical, openGraphUrl } = await urlsForRequest('/hvac', '/hvac');
  return {
    title: metadataTitle(seo),
    description: seo.description,
    alternates: { canonical },
    openGraph: {
      images: ['/og-home.png'],
      title,
      description: seo.description,
      url: openGraphUrl,
      siteName: 'Executive Receptionist',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description: seo.description, images: ['/og-home.png'] },
  };
}

const CALLS = [
  {
    icon: Flame,
    title: 'No heat',
    caller: '“It’s 28 degrees and the furnace is blowing cold air.”',
    ava: 'Ava gets the name, callback number, address, and what the system is doing, asks if anyone at home is elderly, a baby, or has a medical need, and emails it to you as an urgent lead.',
  },
  {
    icon: Snowflake,
    title: 'No AC',
    caller: '“The upstairs unit quit and it’s 94 in here.”',
    ava: 'Ava treats it as urgent, captures the job details, and emails you the lead right away. She never promises an arrival time.',
  },
  {
    icon: Moon,
    title: 'After-hours emergency',
    caller: '“I smell gas by the furnace.” (11 PM)',
    ava: 'Ava tells everyone to leave the house and call 911 or the gas company from outside, before anything else. Once they are safe, she takes a name and number and sends it to you as an emergency.',
  },
];

export default function HvacPage() {
  return (
    <main className="hvac-page">
      <nav className="hvac-nav">
        <Link href="/" className="hvac-brand">
          Executive Receptionist
        </Link>
        <div>
          <a href="#calls">Calls</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
          <a className="hvac-nav-call" href={AVA_OFFER.contactPhoneHref}>
            <Phone size={16} /> {AVA_OFFER.contactPhoneDisplay}
          </a>
        </div>
      </nav>

      <section className="hvac-hero">
        <p className="hvac-eyebrow">AI receptionist for heating &amp; air companies</p>
        <h1>Never miss another no-heat call.</h1>
        <p className="hvac-lede">
          When the furnace quits at 9 PM, homeowners call the next company on the list if nobody picks up. Ava, your
          AI receptionist, answers every call day or night, captures the job details, books routine visits on your schedule
          during the call, and emails you every lead.
        </p>
        <div className="hvac-cta-row">
          <TrackedCheckoutLink className="hvac-btn hvac-btn-primary" href="/api/checkout?plan=pilot" plan="pilot">
            Start the free 14-day pilot
          </TrackedCheckoutLink>
          <a className="hvac-btn hvac-btn-ghost" href={DEMO_LINK} target="_blank" rel="noopener noreferrer">
            <PhoneCall size={18} /> Talk to the HVAC demo
          </a>
        </div>
        <p className="hvac-small">
          The demo is Ava answering for a made-up shop, &quot;Demo Heating &amp; Air.&quot; Try a no-heat call, a broken
          AC, or ask what a service call costs. It runs in your browser; allow the microphone.
        </p>
      </section>

      <section className="hvac-how" id="calls">
        <h2>The calls Ava handles for you</h2>
        <div className="hvac-calls">
          {CALLS.map(({ icon: Icon, title: t, caller, ava }) => (
            <article key={t} className="hvac-call">
              <h3>
                <Icon size={20} /> {t}
              </h3>
              <p className="hvac-caller">{caller}</p>
              <p>{ava}</p>
            </article>
          ))}
        </div>
        <ul>
          <li>
            <Check size={18} /> <b>Tune-ups and routine work:</b> offers real open windows from your schedule and books
            one during the call, so your office doesn&apos;t have to play phone tag.
          </li>
          <li>
            <Check size={18} /> <b>Pricing questions:</b> gives only the service-call fee you set and never makes up a
            price. Everything else waits on your tech.
          </li>
          <li>
            <Check size={18} /> <b>Every lead in your inbox:</b> name, number, address, the problem, and how urgent it
            is, emailed to you right after the call.
          </li>
          <li>
            <Check size={18} /> <b>Spanish callers:</b> Ava switches to Spanish when the caller does.
          </li>
        </ul>
      </section>

      <section className="hvac-plans" id="pricing">
        <h2>Pilot pricing for home-service shops</h2>
        <div className="hvac-plan-grid">
          <article className="hvac-plan featured">
            <span className="hvac-badge">Free 14-day pilot</span>
            <h3>Executive Receptionist</h3>
            <p className="hvac-price">
              {AVA_OFFER.perBookedJobLabel}
              <small> per booked job</small>
            </p>
            <ul>
              <li><Check size={16} /> Free 14-day pilot with a card on file</li>
              <li><Check size={16} /> $0 until your first booked job</li>
              <li><Check size={16} /> Then {AVA_OFFER.perBookedJobLabel} per booked job, capped at {AVA_OFFER.monthlyCapLabel}/month</li>
              <li><Check size={16} /> Answers your HVAC calls 24/7</li>
              <li><Check size={16} /> Cancel anytime, month to month</li>
            </ul>
            <TrackedCheckoutLink className="hvac-btn hvac-btn-primary" href="/api/checkout?plan=pilot" plan="pilot">
              Start the free 14-day pilot
            </TrackedCheckoutLink>
          </article>
        </div>
        <div className="hvac-trial">
          <h3>The guarantee</h3>
          <p>No real caller lead during your pilot means no charge. You pay nothing.</p>
        </div>
      </section>

      <section className="hvac-contact" id="contact">
        <div>
          <h2>Talk to a real person</h2>
          <p>
            I&apos;m Cole Collins. Call or text me at <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>{' '}
            and I&apos;ll set Ava up on your line, or leave your info here and I&apos;ll call you back.
          </p>
          <a className="hvac-btn hvac-btn-primary" href={DEMO_LINK} target="_blank" rel="noopener noreferrer">
            <PhoneCall size={18} /> Talk to the HVAC demo
          </a>
        </div>
        <HvacContactForm />
      </section>

      <footer className="hvac-footer">
        <span>Executive Receptionist</span>
        <Link href="/">Home</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>
    </main>
  );
}
