import type { Metadata } from 'next';
import Link from 'next/link';
import { SampleCalls } from '@/components/ava-home/SampleCalls';
import { HeroDemoPicker } from '@/components/suite/HeroDemoPicker';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { MonthlyPlans, PlanCheckoutButton } from '@/components/ava/MonthlyPlans';
import { avaPlanOfferNodes, faqNode } from '@/lib/ava/structured-data';
import { EXECUTIVE_INDUSTRIES } from '@/lib/executive-receptionist';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import styles from './start.module.css';

const seo = pageSeo('/start');
const title = renderedTitle(seo);
const description = seo.description;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/start' },
  openGraph: { title, description, url: '/start', siteName: 'Ava by Front Porch Growth', type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

const HOME_SERVICES = [
  ['HVAC', 'No-cool and no-heat calls'],
  ['Plumbing', 'Leaks, clogs, water heaters'],
  ['Roofing', 'Storm damage and leaks'],
  ['Electrical', 'Outages and panel work'],
  ['Lawn care', 'Mowing and cleanup quotes'],
  ['Landscaping', 'Install and design estimates'],
  ['Pest control', 'Same-day visit requests'],
  ['House cleaning', 'Recurring and move-out cleans'],
  ['Pool service', 'Openings, repairs, weekly care'],
  ['Garage door', 'Stuck doors and broken springs'],
  ['Appliance repair', 'Washer, fridge, oven calls'],
  ['Pressure washing', 'Driveways, siding, decks'],
  ['Tree service', 'Limbs down and removals'],
  ['Fencing', 'New fence and repair quotes'],
  ['Painting', 'Interior and exterior estimates'],
  ['Handyman', 'Small jobs and punch lists'],
  ['Locksmith', 'Lockouts and rekeys'],
  ['Solar', 'Consult requests and service'],
  ['Gutters', 'Cleaning and guards'],
  ['Water damage', 'Emergency mitigation calls'],
  ['Septic', 'Pumping and backups'],
  ['Moving', 'Date and size quotes'],
  ['Junk removal', 'Pickup requests'],
  ['Auto repair', 'No-starts and drop-offs'],
] as const;

const ECOM_HANDLES = [
  'Where is my order? Order status and delivery windows',
  'Shipping costs, speeds, and the states you ship to',
  'Missing tracking emails',
  'How to start a return or exchange, and refund timing',
  'Sizing and fit questions from your size chart',
  'Store hours and how to reach a person',
];

const ECOM_ESCALATES = [
  'Damaged or wrong item received',
  'Marked delivered but never arrived',
  'Double charges and charges they do not recognize',
  'Cancel requests on orders that may have shipped',
  'Wholesale and bulk orders',
  'Anyone who asks for a manager',
];

const COMPARE = [
  ['How the bill is counted', 'Per minute, per call, or per caller, with overage fees', 'One flat monthly price for your plan’s minutes. No per-minute overage charges'],
  ['Running past your minutes', 'Overage billed per minute or per call', 'Ava keeps answering. We reach out about moving you up a plan'],
  ['Booking during the call', 'Often through a connected calendar or scheduling app', 'Once you set your hours in the Desk and turn booking on, Ava books into your Desk calendar during the call. Optional'],
  ['Emergencies and “get me a person”', 'Varies by plan', 'Ava can transfer the call to your phone, if you give her a number'],
  ['Spanish-speaking callers', 'Varies by plan', 'Ava switches to Spanish when the caller does'],
  ['Hear it before you pay', 'Often a sales demo first', 'Six sample calls, a call-in line, and a browser demo on this page'],
  ['Getting started', 'Free trial, then a monthly plan', 'Starter’s first month is $1, then $79/month'],
  ['Setup', 'Do it yourself', 'Done with you by Cole, included on every plan'],
] as const;

/** Published plans, read from each company's own pricing page on the date below. */
const VENDOR_PLANS_CHECKED = 'November 10, 2026';
const VENDOR_PLANS = [
  { name: 'Smith.ai AI Receptionist', bills: 'Each answered call (spam counts by default; up to 10% can be removed)', entry: 'Free for 25 calls/mo, then $3 per call. Pro $150/mo for 75 calls', href: 'https://smith.ai/pricing/ai-receptionist' },
  { name: 'Upfirst', bills: 'Each call (spam, silent, and very short calls are free)', entry: '$24.95/mo for 30 calls', href: 'https://upfirst.ai/pricing' },
  { name: 'Goodcall', bills: 'Each unique caller per month', entry: '$79/mo for 100 callers', href: 'https://www.goodcall.com/pricing' },
  { name: 'Rosie', bills: 'Minutes, rounded up on every call', entry: '$49/mo for 250 minutes', href: 'https://heyrosie.com/pricing' },
  { name: 'Dialzara', bills: 'Minutes', entry: '$29/mo for 60 minutes', href: 'https://dialzara.com/pricing' },
  { name: 'My AI Front Desk', bills: 'Minutes', entry: '$99/mo with 200 minutes, then per minute', href: 'https://www.myaifrontdesk.com/tutorials/how-does-billing-pricing-work-for-my-ai-front-desk' },
  { name: 'Ruby (live receptionists)', bills: 'Receptionist minutes, in 30-second increments', entry: '$250/mo for 50 minutes', href: 'https://www.ruby.com/plans-and-pricing/' },
] as const;

const FAQS = [
  {
    q: 'What does Ava cost?',
    a: `${AVA_OFFER.summary} ${AVA_OFFER.overageNote}`,
  },
  {
    q: 'Is there a free trial?',
    a: 'No free plan or trial. Starter’s first month is $1, then $79/month. Growth, Pro and Elite are billed at their monthly price from the first month.',
  },
  {
    q: 'Which plan is the best value?',
    a: 'Pro: 1,200 minutes for $397 a month, about $0.33 a minute. That is 4x the minutes of Growth for about 2x the price.',
  },
  {
    q: 'Can I hear her first?',
    a: `Yes. Play the sample calls above, call the demo line at ${AVA_DEMO_LINE.display} (she answers as ${AVA_DEMO_LINE.answersAs}), or talk to her in your browser. No card needed for any of them.`,
  },
  {
    q: 'Does she work for online stores?',
    a: 'Yes. She answers order-status, shipping, return, and sizing calls from the policies you give her, and passes the calls that need a person to your team with the caller’s name, number, order number, and the reason. She cannot see your order system unless it is connected during setup, so until then she takes a message for anything order-specific. Stores use the same monthly plans as everyone else.',
  },
  {
    q: 'Is Ava a person?',
    a: 'No. Ava is an AI receptionist, and her greeting says so. She answers inbound calls only and never makes cold calls or sends cold texts.',
  },
  {
    q: 'Do I need an account to buy?',
    a: 'No. Pick a plan and check out. You can sign in to your desk after setup to see her leads.',
  },
  {
    q: 'Does she work for dentists, law firms, and other offices?',
    a: 'Yes, with the questions you approve. She is not a HIPAA product and does not give legal, medical, or financial advice.',
  },
] as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      name: 'Ava AI receptionist',
      description: 'AI phone receptionist for home-service businesses and online stores.',
      brand: { '@type': 'Brand', name: 'Front Porch Growth' },
      offers: avaPlanOfferNodes('/pricing#plans'),
    },
    faqNode([...FAQS]),
  ],
};

export default function StartPage() {
  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <header className={styles.top}>
        <Link className={styles.brand} href="/">
          <span aria-hidden="true">A</span> Ava <small>AI receptionist</small>
        </Link>
        <a className={styles.topCall} href={AVA_DEMO_LINE.href}>
          Call Ava {AVA_DEMO_LINE.display}
        </a>
      </header>

      <section className={styles.hero}>
        <p className={styles.kicker}>For home-service shops and online stores</p>
        <h1>Every call answered. Every real lead sent to you.</h1>
        <p className={styles.lede}>
          Ava is an AI receptionist. She picks up when you can’t, handles the routine questions, and passes you the
          callers who need a person, with their name, number, and what they need.
        </p>
        <div className={styles.heroActions}>
          <PlanCheckoutButton plan="starter" className={styles.cta}>Start for $1</PlanCheckoutButton>
          <a className={styles.callCta} href={AVA_DEMO_LINE.href}>
            Call Ava now: {AVA_DEMO_LINE.display}
          </a>
        </div>
        <ul className={styles.trust} aria-label="The offer">
          <li>Starter: first month $1, then $79/mo</li>
          <li>Pro: 1,200 minutes for $397/mo, best value</li>
          <li>Month to month, cancel anytime</li>
        </ul>
        <p className={styles.fine}>
          {AVA_OFFER.starterIntro} <a href="#pricing">See all four plans</a>.
        </p>
        <div className={styles.picker}>
          <HeroDemoPicker label="Hear Ava for your business" />
        </div>
        <p className={styles.fine}>
          The call-in line answers as {AVA_DEMO_LINE.answersAs}. Browser demos ask for your microphone. Every demo
          business is fictional.
        </p>
      </section>

      <section className={styles.section} id="compare">
        <p className={styles.kicker}>Why Ava</p>
        <h2>One flat monthly price. No overage surprises.</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col"><span className={styles.srOnly}>Question</span></th>
                <th scope="col">Typical AI answering service</th>
                <th scope="col">Ava</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, typical, ava]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{typical}</td>
                  <td><b>{ava}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          “Typical” describes the per-minute, per-call, and per-caller plans that most AI receptionist companies publish.
        </p>

        <h3 className={styles.subhead}>What the others publish</h3>
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.compareVendors}`}>
            <caption className={styles.srOnly}>Published starting plans of other AI receptionist services</caption>
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">What you pay for</th>
                <th scope="col">Published starting plan</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.usRow}>
                <th scope="row">Ava</th>
                <td>A flat monthly plan with included minutes; no per-minute overage charges</td>
                <td>$79/mo for 100 minutes (first month $1). Pro $397/mo for 1,200 minutes</td>
              </tr>
              {VENDOR_PLANS.map((vendor) => (
                <tr key={vendor.name}>
                  <th scope="row">
                    <a href={vendor.href} target="_blank" rel="noopener noreferrer nofollow">{vendor.name}</a>
                  </th>
                  <td>{vendor.bills}</td>
                  <td>{vendor.entry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          Read from each company’s own pricing page on {VENDOR_PLANS_CHECKED}. Prices change, so check the linked page.
          Several of these services also book appointments during the call. Ava does too, into your Desk calendar on the
          hours you set there, once booking is turned on. Google Calendar sync is not switched on yet, and field-service
          apps are not supported. Names are trademarks of their
          owners; no endorsement implied.
        </p>
      </section>

      <section className={styles.section} id="home-services">
        <p className={styles.kicker}>Home services</p>
        <h2>Built for the trades that answer the phone with full hands.</h2>
        <ul className={styles.trades}>
          {HOME_SERVICES.map(([name, line]) => (
            <li key={name}>
              <b>{name}</b>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${styles.section} ${styles.ecom}`} id="ecommerce">
        <p className={styles.kicker}>E-commerce</p>
        <h2>Stop answering “where’s my order?” all day.</h2>
        <p className={styles.lede}>
          Most store calls are the same few questions. Ava answers them from your policies, around the clock, and only
          sends you the calls that need a person.
        </p>
        <div className={styles.ecomGrid}>
          <div>
            <h3>Ava handles</h3>
            <ul className={styles.checks}>
              {ECOM_HANDLES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Ava passes to your team</h3>
            <ul className={styles.arrows}>
              {ECOM_ESCALATES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={styles.note}>
              Each one arrives with the caller’s name, number, order number, and a short reason. She never takes card
              numbers.
            </p>
          </div>
        </div>
        <div className={styles.ecomActions}>
          <a className={styles.callCta} href="#sample-ecommerce">
            Hear a store call
          </a>
          <a className={styles.callCta} href="https://elevenlabs.io/app/talk-to?agent_id=agent_7301m727915ke55syb59xd04s1m4" target="_blank" rel="noopener noreferrer">
            Talk to the store demo
          </a>
        </div>
        <div className={styles.storePrice}>
          <p className={styles.note}>Stores use the same monthly plans. <a href="#pricing">See plans</a>.</p>
          <p className={styles.note}>
            Questions about a store setup? Call Cole at{' '}
            <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>.
          </p>
        </div>
      </section>

      <section className={styles.section} id="samples">
        <p className={styles.kicker}>Listen</p>
        <h2>Six sample calls. Press play.</h2>
        <SampleCalls order={['ecommerce', 'hvac', 'plumbing', 'roofing', 'electrical', 'auto-repair']} />
      </section>

      <section className={styles.section} id="also">
        <p className={styles.kicker}>Also works for</p>
        <h2>Offices that live on the phone, too.</h2>
        <ul className={styles.also}>
          {EXECUTIVE_INDUSTRIES.map((industry) => (
            <li key={industry.slug}>
              <b>{industry.name}</b>
              <span>{industry.line}</span>
            </li>
          ))}
        </ul>
        <p className={styles.note}>Ava is not a HIPAA product and does not give legal, medical, or financial advice.</p>
      </section>

      <section className={styles.section} id="pricing">
        <MonthlyPlans />
        <p className={styles.note}>No account needed to buy. Setup is done with you by Cole.</p>
      </section>

      <section className={styles.section} id="faq">
        <p className={styles.kicker}>Questions</p>
        <h2>Straight answers.</h2>
        <div className={styles.faq}>
          {FAQS.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>
          Questions for a person? Call Cole at <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a> or email{' '}
          <a href={`mailto:${AVA_OFFER.contactEmail}`}>{AVA_OFFER.contactEmail}</a>.
        </p>
        <p>{AVA_OFFER.footerLine}</p>
        <nav aria-label="Legal">
          <Link href="/">Front Porch Growth</Link>
          <Link href="/login?next=/desk">Customer sign in</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </footer>

      <div className={styles.stickyBar}>
        <a href={AVA_DEMO_LINE.href}>Call Ava</a>
        <PlanCheckoutButton plan="starter" className={styles.stickyCta}>Start for $1</PlanCheckoutButton>
      </div>
    </main>
  );
}
