import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, MapPin, Phone, PhoneCall, ShieldCheck } from 'lucide-react';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { GET_FOUND_AREA, GET_FOUND_GUARANTEES, GET_FOUND_TIERS } from '@/lib/ava/get-found';
import { avaOrganization, faqNode } from '@/lib/ava/structured-data';
import { urlsForRequest } from '@/lib/seo/host-metadata';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { EXECUTIVE_RECEPTIONIST_ORIGIN } from '@/lib/site-url';
import { ErDemoBar, ErLinkColumns } from '@/components/er/ErSite';
import GadsdenContactForm from './contact-form';
import '../hvac/hvac.css';
import './gadsden.css';

const seo = pageSeo('/gadsden');
const title = renderedTitle(seo);
const PAGE_URL = `${EXECUTIVE_RECEPTIONIST_ORIGIN}/gadsden`;
const DEMO_LINE_DISPLAY = '(256) 952-4935';
const DEMO_LINE_HREF = 'tel:+12569524935';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { canonical, openGraphUrl } = await urlsForRequest('/gadsden', '/gadsden');
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

const AVA_POINTS = [
  'Answers your line 24/7 when you can’t: after hours, or when you’re busy or on a job.',
  'Takes the caller’s name, number, address and the problem.',
  'Flags emergencies (no heat, a burst pipe, a gas smell gets safety steps first).',
  'Emails you a summary right after every call, so you have a callback list in the morning.',
  'You keep your number. You forward it to Ava after hours, when busy, or all the time.',
];

const GOOGLE_POINTS = [
  'Three Google posts a week, written from your real jobs and photos. You approve them first.',
  'A reply to every new review. Anything under 4 stars comes to you before it goes up.',
  'A tune-up at the start: categories, services, hours, holiday hours, service area, photos.',
  'A check of what Google, ChatGPT and other AI assistants say when someone asks for your kind of job in your town.',
  'A one-page report each month with your call count straight from Google.',
];

const STEPS = [
  'Add us as a Manager on your Google profile. It takes two minutes, you stay the owner, and you can remove us anytime.',
  'We screenshot your Google call numbers for the baseline and send them to you before we change anything.',
  'Send 5 to 10 photos from real jobs, your hours, the towns you serve, and what counts as an emergency.',
  'Ava goes on your line after a test call passes, and your first week of posts goes out once you approve it.',
];

const FAQS = [
  {
    q: 'Do you guarantee I’ll rank first on Google Maps?',
    a: 'No. Nobody can honestly promise a ranking. What we guarantee is in writing and measured in Google’s own report: calls from your profile, against your baseline.',
  },
  {
    q: 'Does Ava book the appointment or text the customer?',
    a: 'Not in this package. Ava answers, takes the details, flags emergencies and emails you a summary right after the call, so your office calls back and books it.',
  },
  {
    q: 'Can Ava transfer a caller to me?',
    a: 'Not in this package. Emergencies are flagged at the top of the email so you see them first.',
  },
  {
    q: 'Will you ask my customers for 5-star reviews?',
    a: 'We give you a short, neutral way to ask every customer for an honest review, good or bad. We never offer anything for a review, never filter out unhappy customers, and never write reviews.',
  },
  {
    q: 'Do you need my Google password?',
    a: 'No. You add us as a Manager from your profile settings. You stay the owner and can remove us at any time.',
  },
  {
    q: 'How is setup done?',
    a: 'Remotely, by phone and email. Most shops are live within a few business days of sending photos and accepting the Manager invite. Google sometimes holds profile edits for review.',
  },
  {
    q: 'Is there a contract?',
    a: 'No. Every plan is month to month and you can cancel anytime. The setup fee is one time.',
  },
  {
    q: 'What if I just want Ava on my phone?',
    a: `You can start yourself: ${AVA_OFFER.summary}`,
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
      serviceType: 'AI phone receptionist and Google Business Profile management for home-service trades',
      audience: { '@type': 'BusinessAudience', name: 'HVAC, plumbing, electrical, roofing and septic companies' },
      areaServed: GET_FOUND_AREA.map((city) => ({ '@type': 'City', name: `${city}, AL` })),
      provider: avaOrganization(),
      offers: GET_FOUND_TIERS.map((tier) => ({
        '@type': 'Offer',
        name: tier.name,
        price: (tier.monthlyCents / 100).toFixed(2),
        priceCurrency: 'USD',
        url: `${PAGE_URL}#plans`,
        description: `${tier.minutesLabel}. ${tier.setupLabel}. Month to month.`,
      })),
    },
    faqNode(FAQS),
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Executive Receptionist', item: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Gadsden', item: PAGE_URL },
      ],
    },
  ],
};

export default function GadsdenPage() {
  return (
    <main className="hvac-page">
      <ErDemoBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <nav className="hvac-nav">
        <Link href="/" className="hvac-brand">
          Executive Receptionist
        </Link>
        <div>
          <a href="#what">What you get</a>
          <a href="#plans">Plans</a>
          <a href="#guarantee">Guarantee</a>
          <a href="#contact">Contact</a>
          <a className="hvac-nav-call" href={AVA_OFFER.contactPhoneHref}>
            <Phone size={16} /> {AVA_OFFER.contactPhoneDisplay}
          </a>
        </div>
      </nav>

      <section className="hvac-hero">
        <p className="hvac-eyebrow">
          <MapPin size={14} /> For Gadsden-area HVAC, plumbing, electrical, roofing and septic shops
        </p>
        <h1>Answer every call. Get found on Google.</h1>
        <p className="hvac-lede">
          Homeowners in {GET_FOUND_AREA.slice(0, 4).join(', ')} and nearby search Google, call the first shop they see,
          and move on if nobody picks up. Ava, your AI receptionist, answers your line 24/7, and we keep your Google
          profile active every week, done for you.
        </p>
        <div className="hvac-cta-row">
          <a className="hvac-btn hvac-btn-primary" href="#contact">
            Get a free Google profile before-and-after
          </a>
          <a className="hvac-btn hvac-btn-ghost" href={DEMO_LINE_HREF}>
            <PhoneCall size={18} /> Call the demo line: {DEMO_LINE_DISPLAY}
          </a>
        </div>
        <p className="hvac-small">
          The demo line answers as Porchlight Heating &amp; Air, a made-up shop. Try a no-heat call at 10 PM and see what
          she asks. Plans from $297/month, month to month.
        </p>
      </section>

      <section className="hvac-how" id="what">
        <h2>What you get</h2>
        <div className="gf-two">
          <article className="gf-card">
            <h3>
              <PhoneCall size={20} /> Ava answers your phone
            </h3>
            <ul>
              {AVA_POINTS.map((point) => (
                <li key={point}>
                  <Check size={18} /> <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="gf-card">
            <h3>
              <MapPin size={20} /> We run your Google profile
            </h3>
            <ul>
              {GOOGLE_POINTS.map((point) => (
                <li key={point}>
                  <Check size={18} /> <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="hvac-plans" id="plans">
        <h2>Three plans, month to month</h2>
        <div className="hvac-plan-grid">
          {GET_FOUND_TIERS.map((tier) => (
            <article key={tier.key} className={`hvac-plan${tier.featured ? ' featured' : ''}`}>
              {tier.badge ? <span className="hvac-badge">{tier.badge}</span> : null}
              <h3>{tier.name}</h3>
              <p className="hvac-price">
                {tier.monthlyLabel}
                <small>/month</small>
              </p>
              <p className="hvac-setup">
                {tier.setupLabel} · {tier.minutesLabel}
              </p>
              <p>{tier.blurb}</p>
              <ul>
                {tier.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} /> <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="gf-tier-guarantees">
                {tier.guarantees.map((guarantee) => (
                  <p key={guarantee} style={{ margin: '.2rem 0' }}>
                    <ShieldCheck size={16} /> <b>{guarantee}</b>
                  </p>
                ))}
              </div>
              <a className="hvac-btn hvac-btn-primary" href="#contact">
                Talk to Cole about {tier.name}
              </a>
            </article>
          ))}
        </div>
        <p className="hvac-small" style={{ marginTop: '1rem' }}>
          Spam, robocall and wrong-number minutes are credited back. Want to start smaller on your own? See the{' '}
          <Link href="/pricing">self-serve plans</Link>, from $25/month, or Starter at $1 for the first month.
        </p>
      </section>

      <section className="hvac-how" id="guarantee">
        <h2>The guarantees, in plain words</h2>
        <div className="gf-guarantee">
          <h3>Catch 5 (every plan)</h3>
          <p>{GET_FOUND_GUARANTEES.catchFive}</p>
        </div>
        <div className="gf-guarantee">
          <h3>20% more Google calls in 90 days ($497 and $997 plans)</h3>
          <p>{GET_FOUND_GUARANTEES.twentyPercent}</p>
          <p>
            <b>Conditions:</b>
          </p>
          <ul>
            {GET_FOUND_GUARANTEES.conditions.map((condition) => (
              <li key={condition}>
                <Check size={18} /> <span>{condition}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="hvac-small">We don’t promise a map ranking, a mention in ChatGPT, booked jobs or revenue.</p>
      </section>

      <section className="hvac-how" id="start">
        <h2>How it starts</h2>
        <ol className="gf-steps">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="hvac-how" id="faq">
        <h2>Questions</h2>
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
          <h2>Get your free before-and-after</h2>
          <p>
            I&apos;m Cole Collins. Tell me about your shop and I&apos;ll send you what your Google profile shows now, three
            example posts and review replies written from your own jobs, and what Ava would do with your after-hours
            calls. Nothing gets posted or changed without you.
          </p>
          <p>
            Or call me at <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>.
          </p>
          <a className="hvac-btn hvac-btn-ghost" href={DEMO_LINE_HREF}>
            <PhoneCall size={18} /> Call the demo line: {DEMO_LINE_DISPLAY}
          </a>
        </div>
        <GadsdenContactForm />
      </section>

      <ErLinkColumns />
      <footer className="hvac-footer">
        <span>Executive Receptionist · Operated by Cole Collins DBA Executive Receptionist, Hanceville, AL</span>
        <Link href="/">Home</Link>
        <Link href="/hvac">HVAC</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>
    </main>
  );
}
