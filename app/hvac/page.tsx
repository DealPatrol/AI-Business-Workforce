import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Phone, PhoneCall, Snowflake, Flame, Moon } from 'lucide-react';
import { MonthlyPlans, PlanCheckoutButton } from '@/components/ava/MonthlyPlans';
import { exampleSentence } from '@/lib/ava/missed-call-math';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { avaOfferNodes, avaOrganization, faqNode } from '@/lib/ava/structured-data';
import { getErDemoNiche } from '@/lib/er-demos';
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

/** Sample no-cool call (merged here from /receptionist/hvac). */
const SAMPLE = getErDemoNiche('hvac');

/** What Ava asks on every HVAC call (merged here from the HVAC answering guide). */
const QUESTIONS = [
  'Name and callback number',
  'Service address',
  'Heating, cooling, or indoor air problem',
  'Whether the system is running at all',
  'Whether anyone at home is elderly, a baby, or has a medical need',
  'Repair, tune-up, or replacement question',
];

const ROI_EXAMPLE = exampleSentence({ missedPerWeek: 8, oneIn: 4, jobValue: 350, jobLabel: 'HVAC service call' });

const FAQS = [
  {
    q: 'Does Ava book the HVAC visit?',
    a: 'Yes, once your hours are set in the Desk and booking is on. She offers real open windows and books one into your Desk calendar during the call. Until then she takes the details and emails you the lead so your office can call back and book it.',
  },
  {
    q: 'What happens on an after-hours no-heat or gas call?',
    a: 'A gas smell gets safety instructions first: leave the house and call 911 or the gas company from outside. No heat or no AC is flagged as urgent, especially when someone at home is elderly, a baby, or has a medical need, and the lead is emailed to you right away. She never promises an arrival time.',
  },
  {
    q: 'Will Ava quote prices?',
    a: 'Only the service-call fee or other prices you approve. She never makes up a price for a repair or a new system.',
  },
  {
    q: 'Does it replace ServiceTitan or Housecall Pro?',
    a: 'No. Executive Receptionist is the call layer. Your field software stays where jobs are dispatched and invoiced.',
  },
  {
    q: 'Do I keep my business number?',
    a: 'Yes. You forward your line (after hours, when busy, or all the time) to Ava, so callers still dial the number on your truck.',
  },
  {
    q: 'What does it cost?',
    a: `${AVA_OFFER.summary} ${AVA_OFFER.overageNote}`,
  },
];

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
      provider: avaOrganization(),
      offers: avaOfferNodes(PAGE_URL),
    },
    faqNode(FAQS),
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

      {SAMPLE ? (
        <section className="hvac-how" id="sample">
          <h2>Hear a sample no-cool call</h2>
          <p>
            A prerecorded call to {SAMPLE.company}, a made-up shop. Ava takes the name, number, address, and what the
            system is doing, then checks whether anyone at home is at risk.
          </p>
          <audio controls preload="none" src={SAMPLE.audioSrc} style={{ width: '100%', maxWidth: 560 }}>
            Your browser cannot play this sample.
          </audio>
          <details>
            <summary>Read the transcript</summary>
            {SAMPLE.transcript.map((line, index) => (
              <p key={index}>
                <b>{line.speaker === 'Receptionist' ? 'Ava' : 'Caller'}:</b> {line.text}
              </p>
            ))}
          </details>
        </section>
      ) : null}

      <section className="hvac-how" id="questions">
        <h2>What Ava asks every HVAC caller</h2>
        <ul>
          {QUESTIONS.map((question) => (
            <li key={question}>
              <Check size={18} /> <span>{question}</span>
            </li>
          ))}
        </ul>
        <h3>What one missed no-cool call can cost</h3>
        <p>
          {ROI_EXAMPLE} If your real ticket is a system replacement, use that higher number on the{' '}
          <Link href="/ava/missed-call-cost-calculator">missed-call calculator</Link>.
        </p>
        <p>
          Not sure your calls are being missed? <Link href="/receptionist/missed-calls">See how after-hours missed calls add up</Link>.
        </p>
      </section>

      <section className="hvac-plans" id="pricing">
        <MonthlyPlans />
      </section>

      <section className="hvac-how" id="faq">
        <h2>HVAC questions</h2>
        {FAQS.map((faq) => (
          <details key={faq.q}>
            <summary>
              <b>{faq.q}</b>
            </summary>
            <p>{faq.a}</p>
          </details>
        ))}
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
        <span>Executive Receptionist · Operated by Cole Collins DBA Executive Receptionist, Hanceville, AL</span>
        <Link href="/">Home</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>
    </main>
  );
}
