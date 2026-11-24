import { ErDemoBar, ErLinkColumns } from '@/components/er/ErSite';
import Link from 'next/link';
import { Check, MessageSquareQuote, Phone, PhoneCall } from 'lucide-react';
import { MonthlyPlans, PlanCheckoutButton } from '@/components/ava/MonthlyPlans';
import { BusinessContactForm } from '@/components/receptionist/BusinessContactForm';
import {
  BUSINESS_PAGES,
  DESK_CALENDAR_LINE,
  INDUSTRY_PAGE_SLUGS,
  businessPageDetails,
  businessPageFaqs,
  type BusinessPage,
} from '@/lib/ava/business-pages';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { getErDemoNiche } from '@/lib/er-demos';
import { faqNode } from '@/lib/ava/structured-data';
import { EXECUTIVE_RECEPTIONIST_ORIGIN } from '@/lib/site-url';
import '@/app/hvac/hvac.css';

function demoFor(page: BusinessPage) {
  const auto = page.slug === 'auto-repair' ? getErDemoNiche('auto-repair') : undefined;
  if (auto) {
    return {
      href: auto.talkUrl,
      label: 'Talk to the auto shop demo',
      note: `The demo is Ava answering for a made-up shop, “${auto.company}.” It runs in your browser; allow the microphone.`,
    };
  }
  return {
    href: AVA_OFFER.demoUrl,
    label: 'Talk to Ava now',
    note: 'The demo is Ava answering for a made-up heating and air company, so you can hear how she sounds and how she takes a message. Yours answers with your business name and only the details you give her. It runs in your browser; allow the microphone.',
  };
}

function structuredData(page: BusinessPage, title: string, description: string) {
  const url = `${EXECUTIVE_RECEPTIONIST_ORIGIN}${page.path}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${url}#service`,
        name: title,
        description,
        url,
        serviceType: 'AI phone receptionist',
        audience: { '@type': 'BusinessAudience', name: page.audience },
        areaServed: { '@type': 'Country', name: 'United States' },
        provider: { '@type': 'Organization', name: 'Executive Receptionist', url: EXECUTIVE_RECEPTIONIST_ORIGIN },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Executive Receptionist', item: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: page.audience, item: url },
        ],
      },
      { '@id': `${url}#faq`, url, ...faqNode(businessPageFaqs(page)) },
    ],
  };
}

export function BusinessLanding({ page, title, description }: { page: BusinessPage; title: string; description: string }) {
  const demo = demoFor(page);
  const json = JSON.stringify(structuredData(page, title, description)).replace(/</g, '\\u003c');
  return (
    <main className="hvac-page">
      <ErDemoBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      <nav className="hvac-nav" aria-label="Main">
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
        <p className="hvac-eyebrow">{page.eyebrow}</p>
        <h1>{page.headline}</h1>
        <p className="hvac-lede">
          {page.hook} {DESK_CALENDAR_LINE(page.bookingNoun)}
        </p>
        <div className="hvac-cta-row">
          <PlanCheckoutButton plan="starter" className="hvac-btn hvac-btn-primary">
            Start for $1
          </PlanCheckoutButton>
          <a className="hvac-btn hvac-btn-ghost" href={demo.href} target="_blank" rel="noopener noreferrer">
            <PhoneCall size={18} /> {demo.label}
          </a>
        </div>
        <p className="hvac-small">{AVA_OFFER.starterIntro}</p>
        <p className="hvac-small">{demo.note}</p>
      </section>

      <section className="hvac-how" id="calls">
        <h2>The calls Ava handles for you</h2>
        <div className="hvac-calls">
          {page.calls.map((call) => (
            <article key={call.title} className="hvac-call">
              <h3>
                <PhoneCall size={20} /> {call.title}
              </h3>
              <p className="hvac-caller">{call.caller}</p>
              <p>{call.ava}</p>
            </article>
          ))}
        </div>
        <h2>What Ava does on every plan</h2>
        <ul>
          {businessPageDetails(page).map((item) => (
            <li key={item}>
              <Check size={18} /> <span>{item}</span>
            </li>
          ))}
          <li>
            <Check size={18} /> <span>{DESK_CALENDAR_LINE(page.bookingNoun)} Until then, she takes the details so you can call back.</span>
          </li>
          <li>
            <Check size={18} /> <span>Month to month. Cancel anytime.</span>
          </li>
        </ul>
      </section>

      <section className="hvac-how" aria-labelledby="voices-title">
        <h2 id="voices-title">What owners say about missed calls</h2>
        {page.voices.map((voice) => (
          <blockquote key={voice.href} className="hvac-call">
            <p className="hvac-caller">
              <MessageSquareQuote size={18} /> “{voice.quote}”
            </p>
            <p className="hvac-small">
              <a href={voice.href} target="_blank" rel="noopener noreferrer nofollow">
                {voice.who}
              </a>
            </p>
          </blockquote>
        ))}
      </section>

      <section className="hvac-how" id="faq" aria-labelledby="faq-title">
        <h2 id="faq-title">Questions {page.slug === 'business' ? 'owners' : page.audience.toLowerCase()} ask about Ava</h2>
        {businessPageFaqs(page).map((faq) => (
          <details key={faq.q}>
            <summary>
              <b>{faq.q}</b>
            </summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </section>

      <section className="hvac-plans" id="pricing">
        <MonthlyPlans includes={false} />
        <p className="hvac-small">{AVA_OFFER.overageNote}</p>
      </section>

      <section className="hvac-contact" id="contact">
        <div>
          <h2>Talk to a real person</h2>
          <p>
            I&apos;m Cole Collins. Call me at <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a> and
            I&apos;ll set Ava up on your line, or leave your info here and I&apos;ll call you back.
          </p>
          <a className="hvac-btn hvac-btn-primary" href={demo.href} target="_blank" rel="noopener noreferrer">
            <PhoneCall size={18} /> {demo.label}
          </a>
        </div>
        <BusinessContactForm industry={page.audience} />
      </section>

      <section className="hvac-how" aria-labelledby="more-title">
        <h2 id="more-title">Ava for other businesses</h2>
        <p className="hvac-small">
          {[...(page.slug === 'business' ? [] : (['business'] as const)), ...INDUSTRY_PAGE_SLUGS.filter((slug) => slug !== page.slug)].map(
            (slug) => (
              <span key={slug}>
                <Link href={BUSINESS_PAGES[slug].path}>{slug === 'business' ? 'Any business' : BUSINESS_PAGES[slug].audience}</Link>
                {' · '}
              </span>
            ),
          )}
          <Link href="/hvac">HVAC companies</Link>
        </p>
      </section>

      <ErLinkColumns />
      <footer className="hvac-footer">
        <span>{AVA_OFFER.footerLine}</span>
        <Link href="/">Home</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>
    </main>
  );
}
