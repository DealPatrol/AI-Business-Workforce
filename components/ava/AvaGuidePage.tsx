import Link from 'next/link';
import { ArrowRight, Check, PhoneCall, Sparkles } from 'lucide-react';
import { AvaFooter } from '@/components/ava/AvaFooter';
import { AvaPlanCards } from '@/components/ava/AvaPlanCards';
import { JsonLd } from '@/components/ava/JsonLd';
import { MissedCallCalculator } from '@/components/ava/MissedCallCalculator';
import { SampleCall } from '@/components/ava/SampleCall';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { getAvaGuide, type AvaGuide } from '@/lib/ava/trade-pages';
import {
  avaProductNode,
  avaServiceNode,
  faqNode,
  jsonLdGraph,
} from '@/lib/ava/structured-data';
import { absoluteSiteUrl } from '@/lib/site-url';

function GuideExtra({ guide }: { guide: AvaGuide }) {
  switch (guide.kind) {
    case 'trade':
    case 'guide':
      return null;
    case 'comparison':
      return (
        <section className="comparison">
          <div className="section-title">
            <span className="kicker">SIDE BY SIDE</span>
            <h2>What you are actually buying.</h2>
          </div>
          <div className="comparison-grid">
            {(guide.columns || []).map((column) => (
              <article key={column.title} className={column.title === 'Ava' ? 'ava-choice' : undefined}>
                <small>{column.title}</small>
                <h3>{column.title}</h3>
                <p>{column.body}</p>
              </article>
            ))}
          </div>
        </section>
      );
    case 'calculator':
      return (
        <section className="comparison">
          <div className="section-title">
            <span className="kicker">YOUR INPUTS</span>
            <h2>Run the missed-call arithmetic.</h2>
            <p>The result updates as you type. It stays an example.</p>
          </div>
          <MissedCallCalculator />
        </section>
      );
    default: {
      const unexpected: never = guide.kind;
      return unexpected;
    }
  }
}

export function AvaGuidePage({ guide, homeHref }: { guide: AvaGuide; homeHref: string }) {
  const pageUrl = absoluteSiteUrl(`/ava/${guide.slug}`);
  const demoHref = `${homeHref}#hear-demo`;
  const liveHref = `${homeHref}#talk-to-ava`;
  const graph = jsonLdGraph([
    avaServiceNode({
      name: guide.title,
      description: guide.description,
      url: pageUrl,
      audience: guide.audience,
      serviceType: 'AI receptionist and call answering',
    }),
    avaProductNode({
      name: guide.title,
      description: guide.description,
      url: pageUrl,
    }),
    faqNode(guide.faqs),
  ]);

  return (
    <main className="ava-sales">
      <JsonLd data={graph} />
      <nav className="ava-nav">
        <Link className="ava-brand" href={homeHref}>
          <span>
            <Sparkles size={17} />
          </span>{' '}
          Ava
        </Link>
        <div>
          <Link href="#pricing">Pricing</Link>
          <Link href={liveHref}>Try the demo</Link>
          <Link href="/ava/missed-call-cost-calculator">Calculator</Link>
        </div>
        <TrackedCheckoutLink className="nav-cta" href="/api/checkout?plan=starter" plan="starter">
          Start free trial
        </TrackedCheckoutLink>
      </nav>

      <section className="sales-hero">
        <div className="hero-copy">
          <span className="kicker">{guide.eyebrow}</span>
          <h1>{guide.h1}</h1>
          <p>{guide.lede}</p>
          <p className="trial-line">Free 7-day trial, then $79, $149, or $299 a month. $0 setup.</p>
          <div className="hero-actions">
            <Link className="sales-btn" href={demoHref}>
              <PhoneCall size={18} /> Hear a demo call
            </Link>
            <TrackedCheckoutLink className="sales-btn secondary" href="/api/checkout?plan=starter" plan="starter">
              Start free 7-day trial <ArrowRight size={18} />
            </TrackedCheckoutLink>
          </div>
          <div className="trust-row">
            <span>
              <Check /> Texts you the lead
            </span>
            <span>
              <Check /> 24/7 if you forward the line
            </span>
            <span>
              <Check /> Cancel anytime
            </span>
          </div>
        </div>
        <SampleCall
          className="guide-sample"
          title="Hear a demo call"
          detail="Prerecorded landscaping estimate. Not a recording of your customers."
          surface={`guide:${guide.slug}`}
        />
      </section>

      <section className="how-section">
        <div className="section-title">
          <span className="kicker">THE CALLS</span>
          <h2>Built around {guide.audience}.</h2>
          <p>{guide.pain}</p>
        </div>
        <div className="steps-grid">
          {guide.calls.map((item, index) => (
            <article key={item}>
              <span>0{index + 1}</span>
              <PhoneCall />
              <h3>{item}</h3>
              <p>Ava asks what you approved, then texts you. She does not invent a price.</p>
            </article>
          ))}
        </div>
      </section>

      <GuideExtra guide={guide} />

      <section className="comparison">
        <div className="section-title">
          <span className="kicker">WHAT YOU GET BACK</span>
          <h2>A lead, not a vague voicemail.</h2>
        </div>
        <div className="comparison-grid split-two">
          <article>
            <small>QUALIFICATION</small>
            <h3>Details worth a callback</h3>
            <ul>
              {guide.qualification.map((item) => (
                <li key={item}>
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
          </article>
          <article>
            <small>MISSED-CALL MATH</small>
            <h3>{guide.roiTitle}</h3>
            <p>{guide.roiBody}</p>
            <p>
              <Link href="/ava/missed-call-cost-calculator">Open the missed-call calculator</Link>
            </p>
          </article>
        </div>
        {guide.sources?.length ? (
          <ul className="source-list">
            {guide.sources.map((source) => (
              <li key={source.href}>
                <a href={source.href} rel="noreferrer">
                  {source.text}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="pricing" id="pricing">
        <div className="section-title">
          <span className="kicker">PRICING</span>
          <h2>Free 7-day trial. $0 setup.</h2>
          <p>
            Checkout is Stripe. After the trial, the plan you picked bills monthly. Included minutes
            reset each month. Overage uses the rate on the card.
          </p>
        </div>
        <AvaPlanCards />
      </section>

      <section className="faq" id="faq">
        <div className="section-title">
          <span className="kicker">FAQ</span>
          <h2>Questions before you forward the phone.</h2>
        </div>
        <div className="faq-grid">
          {guide.faqs.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bad-options">
        <div className="section-title">
          <span className="kicker">RELATED</span>
          <h2>Other ways buyers look this up.</h2>
        </div>
        <div className="options-grid">
          {guide.related.map((slug) => {
            const related = getAvaGuide(slug);
            if (!related) return null;
            return (
              <article key={slug}>
                <span>{related.navLabel}</span>
                <h3>{related.title}</h3>
                <p>{related.blurb}</p>
                <Link href={`/ava/${slug}`}>
                  Read it <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="final-cta">
        <span className="kicker">HEAR IT, THEN START</span>
        <h2>Try the demo, then start the trial in Stripe.</h2>
        <p>
          The sample call is a landscaping estimate. The live demo is in the browser. Checkout opens
          Stripe for the plan you pick. Starter is $79 a month after the trial.
        </p>
        <div>
          <Link className="sales-btn light" href={liveHref}>
            <PhoneCall size={18} /> Try the live demo
          </Link>
          <TrackedCheckoutLink className="sales-btn outline" href="/api/checkout?plan=starter" plan="starter">
            Start free 7-day trial
          </TrackedCheckoutLink>
        </div>
      </section>
      <AvaFooter homeHref={homeHref} />
    </main>
  );
}
