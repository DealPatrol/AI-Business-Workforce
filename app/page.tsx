import type { Metadata } from 'next';
import Link from 'next/link';
import { SampleCalls } from '@/components/ava-home/SampleCalls';
import avaStyles from '@/components/ava-home/ava-home.module.css';
import { HeroDemoPicker } from '@/components/suite/HeroDemoPicker';
import { InvoicingWaitlistForm } from '@/components/suite/InvoicingWaitlistForm';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/home.module.css';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { MonthlyPlans, PlanCheckoutButton } from '@/components/ava/MonthlyPlans';
import { avaPlanOfferNodes, faqNode } from '@/lib/ava/structured-data';
import { DESK_TOOLS } from '@/lib/desk-tools';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { absoluteSiteUrl } from '@/lib/site-url';

const seo = pageSeo('/');
const title = renderedTitle(seo);
const description = seo.description;

const HOME_FAQS = [
  {
    q: 'Who is Ava?',
    a: 'Ava is an AI phone receptionist. She answers the calls you cannot pick up, asks the questions you approve for your business, and sends you the caller’s name, number, and what they need. Her greeting tells callers she is an AI receptionist.',
  },
  {
    q: 'Can I hear her before I pay?',
    a: `Yes, three ways. Play any sample call on this page. Call the demo line at ${AVA_DEMO_LINE.display}, where she answers as ${AVA_DEMO_LINE.answersAs}. Or talk to her in your browser with your microphone. None of these need a card.`,
  },
  {
    q: 'What does it cost?',
    a: `${AVA_OFFER.summary} ${AVA_OFFER.overageNote}`,
  },
  {
    q: 'Is there a free trial?',
    a: 'No free plan or trial. Starter’s first month is $1, then $79/month. Growth, Pro and Elite are billed at their monthly price from the first month. All plans renew monthly; cancel anytime.',
  },
  {
    q: 'Do I need an account to start?',
    a: 'No. Pick a plan and check out without signing in. After setup you can sign in to your desk to see Ava’s leads and the rest of the tools.',
  },
  {
    q: 'Does she book the job for me?',
    a: 'Once your hours are set up in your Desk, she can offer open times and put the visit on your Desk calendar. Until then she captures the lead and sends it to you, and you book the work. She never invents a price or promises an arrival time you have not offered.',
  },
  {
    q: 'Which businesses is she for?',
    a: 'Home-service shops first: HVAC, plumbing, roofing, electrical, lawn care, pest control, cleaning, pool, garage door, and more. Online stores can use her for order, shipping, and return calls on the same monthly plans. Dental offices, law firms, and med spas can use her too if the questions you approve are appropriate. She is not a HIPAA product and does not give legal advice.',
  },
  {
    q: 'Does she call or text people on her own?',
    a: 'No. Ava only answers inbound calls. She never makes cold calls or sends cold texts.',
  },
] as const;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/' },
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'Front Porch Growth',
    type: 'website',
    images: [{ url: '/og-home.png', width: 1200, height: 630, alt: 'Ava, the AI receptionist for home service businesses' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-home.png'],
  },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${absoluteSiteUrl('/')}#org`,
      name: 'Front Porch Growth',
      url: absoluteSiteUrl('/'),
      logo: absoluteSiteUrl('/brand-logo.png'),
      description: 'Ava, an AI phone receptionist, plus lead generation and postcard tools for home-service businesses.',
      email: 'hello@frontporchgrowth.com',
      makesOffer: [
        ...avaPlanOfferNodes(absoluteSiteUrl('/pricing#plans')),
      ],
    },
    { '@type': 'WebSite', name: 'Front Porch Growth', url: absoluteSiteUrl('/'), publisher: { '@id': `${absoluteSiteUrl('/')}#org` } },
    faqNode([...HOME_FAQS]),
  ],
};

const BUSINESS_TYPES = [
  'HVAC',
  'Plumbing',
  'Roofing',
  'Electrical',
  'Lawn care',
  'Pest control',
  'Cleaning',
  'Pool service',
  'Garage door',
  'Tree service',
  'Online stores',
  'Auto repair',
];

const STEPS = [
  { number: '01', title: 'The phone rings while you work', detail: 'You are under a sink, up a ladder, or with another customer.' },
  { number: '02', title: 'Ava answers', detail: 'She says she is an AI receptionist and asks the questions you wrote for your business.' },
  { number: '03', title: 'You get the lead', detail: 'Name, number, address, and what they need land in your email and your desk.' },
  { number: '04', title: 'You call back and book it', detail: 'You keep your prices and your calendar. Mark it booked in one tap.' },
];

export default function SuiteHomePage() {
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, '\\u003c') }} />

      <section className={styles.hero} id="start">
        <div>
          <span className={styles.eyebrow}>Ava · AI receptionist for home services</span>
          <h1>Meet Ava. She answers the calls you can’t.</h1>
          <p className={styles.lede}>
            Ava picks up every call, asks the right questions, and sends you the lead so you can call back and book the
            job. Listen to her, then call her yourself.
          </p>
          <p className={styles.lede} style={{ marginTop: 0 }}>
            Run a heating &amp; air shop? <Link href="/hvac">See Ava for HVAC companies →</Link>
          </p>
          <HeroDemoPicker label="Hear Ava for your business" />
          <div className={styles.actions}>
            <PlanCheckoutButton plan="starter" className={styles.primary}>
              Start for $1
            </PlanCheckoutButton>
            <a className={styles.secondary} href={AVA_DEMO_LINE.href}>
              Call Ava: {AVA_DEMO_LINE.display}
            </a>
          </div>
          <p className={styles.fine}>
            {AVA_OFFER.starterIntro} Bigger plans from $197/month. <a href="#pricing">See all plans</a>. No account needed to start.
          </p>
        </div>

        <aside className={avaStyles.callCard} aria-label="Call Ava now">
          <small>Call Ava right now</small>
          <a className={avaStyles.callNumber} href={AVA_DEMO_LINE.href}>
            {AVA_DEMO_LINE.display}
          </a>
          <p>
            Call from any phone. She answers as {AVA_DEMO_LINE.answersAs}. Ask about a broken AC, a price, or whether
            she is a robot.
          </p>
          <div className={avaStyles.callButtons}>
            <a className={avaStyles.callPrimary} href={AVA_DEMO_LINE.href}>
              Call Ava now
            </a>
            <a className={avaStyles.callSecondary} href={AVA_OFFER.demoUrl} target="_blank" rel="noopener noreferrer">
              Or talk to her in your browser
            </a>
          </div>
          <div className={avaStyles.leadPreview}>
            <b>What lands in your inbox after the call:</b>
            <br />
            Example caller · 7:42 PM · AC blowing warm · 412 Walnut St · wants tomorrow morning
          </div>
          <p className={avaStyles.callFine}>
            Demo line for a made-up company. No real technician is sent. Questions for a person? Call Cole at{' '}
            <a href={AVA_OFFER.contactPhoneHref} style={{ color: '#fff' }}>{AVA_OFFER.contactPhoneDisplay}</a>.
          </p>
        </aside>
      </section>

      <section className={styles.strip} aria-label="Business types Ava answers for">
        <span className={styles.stripLabel}>Ava answers for</span>
        {BUSINESS_TYPES.map((type) =>
          type === 'HVAC' ? (
            <Link key={type} href="/hvac" className={styles.chip}>
              {type}
            </Link>
          ) : (
            <span key={type} className={styles.chip}>
              {type}
            </span>
          ),
        )}
      </section>

      <section className={styles.band} id="samples">
        <span className={styles.kicker}>Listen before you pay</span>
        <h2 className={styles.h2}>Six real-sounding calls. Press play.</h2>
        <p className={styles.body}>
          Each sample is a recorded call with a made-up business, not a customer recording. Every demo is also live: press
          “Talk to this demo live” and Ava answers in your browser.
        </p>
        <SampleCalls />
      </section>

      <section className={styles.band} id="how-it-works">
        <span className={styles.kicker}>How it works</span>
        <h2 className={styles.h2}>From a ringing phone to a booked job.</h2>
        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step.number} className={styles.step}>
              <span className={styles.stepNum}>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.band} id="pricing">
        <MonthlyPlans />
      </section>

      <section className={styles.band} id="desk">
        <span className={styles.kicker}>Your desk</span>
        <h2 className={styles.h2}>Ava’s leads and every growth tool, in one place.</h2>
        <p className={styles.body}>
          Sign in to your desk to see what Ava caught, decide what happens next, and open the rest of the Front Porch
          Growth tools. Buying does not need an account.
        </p>
        <ul className={avaStyles.tiles}>
          {DESK_TOOLS.map((tool) => (
            <li key={tool.key} id={tool.key === 'invoices' ? 'invoicing' : undefined}>
              {tool.key === 'invoices' ? (
                <div className={avaStyles.tile}>
                  <h3>{tool.name}</h3>
                  <p>{tool.what}</p>
                  <InvoicingWaitlistForm />
                </div>
              ) : (
                <Link className={avaStyles.tile} href={tool.href}>
                  <h3>{tool.name}</h3>
                  <p>{tool.what}</p>
                  <span className={`${avaStyles.tileMeta} ${tool.status === 'live' ? avaStyles.tileMetaLive : ''}`}>
                    {tool.status === 'waitlist' ? 'Waitlist' : tool.signedIn ? 'In your desk' : 'Open'}
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <Link className={styles.secondary} href="/login?next=/desk">
            Sign in to your desk
          </Link>
        </div>
      </section>

      <section className={styles.band} id="ecommerce">
        <div className={avaStyles.ecomBand}>
          <div>
            <span className={styles.kicker}>Run an online store?</span>
            <h2 className={styles.h2}>Ava answers “where is my order?” so you don’t have to.</h2>
            <ul className={avaStyles.ecomList}>
              <li>Order status, shipping times, and tracking emails</li>
              <li>Returns, exchanges, sizing, and store hours</li>
              <li>Damaged items, double charges, and upset customers go to a person, with notes</li>
            </ul>
            <p className={avaStyles.compareNote}>Stores use the same monthly plans as everyone else. <a href="#pricing">See plans</a>.</p>
          </div>
          <div className={styles.actions}>
            <a className={styles.primary} href="#sample-ecommerce">
              Hear a store call
            </a>
            <Link className={styles.secondary} href="/start#ecommerce">
              See Ava for online stores
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.wideFaq} id="faq">
        <span className={styles.kicker}>Before you pay</span>
        <h2>Straight answers.</h2>
        {HOME_FAQS.map((faq) => (
          <details key={faq.q}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </section>

      <section className={styles.closing}>
        <span className={styles.kicker}>Start with the phone</span>
        <h2>The next call is the one that pays for this.</h2>
        <p>
          Put Ava on your line for $1 with Starter, or go straight to Pro for the best value per minute.
        </p>
        <div className={styles.actions}>
          <PlanCheckoutButton plan="starter" className={styles.primary}>
            Start for $1
          </PlanCheckoutButton>
          <a className={styles.secondary} href={AVA_DEMO_LINE.href}>
            Call Ava: {AVA_DEMO_LINE.display}
          </a>
        </div>
        <p className={styles.closingFine}>
          Ava is an AI receptionist; callers are told. Talk to a person: Cole at{' '}
          <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a> or{' '}
          <a href={`mailto:${AVA_OFFER.contactEmail}`}>{AVA_OFFER.contactEmail}</a>.
        </p>
      </section>
    </SuiteShell>
  );
}
