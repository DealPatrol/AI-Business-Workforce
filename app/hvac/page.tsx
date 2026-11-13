import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Phone, PhoneCall, Snowflake, Flame, Moon } from 'lucide-react';
import { MonthlyPlans, PlanCheckoutButton } from '@/components/ava/MonthlyPlans';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { urlsForRequest } from '@/lib/seo/host-metadata';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { EXECUTIVE_RECEPTIONIST_ORIGIN } from '@/lib/site-url';
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

const PAGE_URL = `${EXECUTIVE_RECEPTIONIST_ORIGIN}/hvac`;

const structured = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      '@id': `${PAGE_URL}#service`,
      name: title,
      description: seo.description,
      url: PAGE_URL,
      serviceType: 'AI phone receptionist for HVAC companies',
      audience: { '@type': 'BusinessAudience', name: 'HVAC companies' },
      areaServed: { '@type': 'Country', name: 'United States' },
      provider: { '@type': 'Organization', name: 'Executive Receptionist', url: EXECUTIVE_RECEPTIONIST_ORIGIN },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Executive Receptionist', item: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'HVAC', item: PAGE_URL },
      ],
    },
  ],
};

export default function HvacPage() {
  return (
    <main className="hvac-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
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
          AI receptionist, answers every call day or night, captures the job details, and emails you every lead. Once your
          calendar is set up in the Desk, she books routine visits into your Desk calendar during the call.
        </p>
        <div className="hvac-cta-row">
          <PlanCheckoutButton plan="starter" className="hvac-btn hvac-btn-primary">
            Start for $1
          </PlanCheckoutButton>
          <a className="hvac-btn hvac-btn-ghost" href={DEMO_LINK} target="_blank" rel="noopener noreferrer">
            <PhoneCall size={18} /> Talk to the HVAC demo
          </a>
        </div>
        <p className="hvac-small">{AVA_OFFER.starterIntro}</p>
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
            <Check size={18} /> <span><b>Tune-ups and routine work:</b> once your hours are set in the Desk and booking is on,
            Ava offers real open windows and books one into your Desk calendar during the call. Until then, she takes
            the details so your office can call back.</span>
          </li>
          <li>
            <Check size={18} /> <span><b>Pricing questions:</b> gives only the service-call fee you set and never makes up a
            price. Everything else waits on your tech.</span>
          </li>
          <li>
            <Check size={18} /> <span><b>Every lead in your inbox:</b> name, number, address, the problem, and how urgent it
            is, emailed to you right after the call.</span>
          </li>
          <li>
            <Check size={18} /> <span><b>Spanish callers:</b> Ava switches to Spanish when the caller does.</span>
          </li>
        </ul>
      </section>

      <section className="hvac-plans" id="pricing">
        <MonthlyPlans />
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
