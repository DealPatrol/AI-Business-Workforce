import Link from 'next/link';
import { ArrowRight, Check, PhoneCall, Sparkles } from 'lucide-react';
import { AvaFooter } from '@/components/ava/AvaFooter';
import { ErTopBars } from '@/components/er/ErSite';
import { AvaPlanCards } from '@/components/ava/AvaPlanCards';
import { JsonLd } from '@/components/ava/JsonLd';
import { MissedCallCalculator } from '@/components/ava/MissedCallCalculator';
import { SampleCall } from '@/components/ava/SampleCall';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { getAvaGuide, type AvaGuide } from '@/lib/ava/trade-pages';
import {
  avaProductNode,
  avaServiceNode,
  executiveReceptionistOrganization,
  AVA_SETUP_STEPS,
  breadcrumbNode,
  faqNode,
  howToNode,
  jsonLdGraph,
} from '@/lib/ava/structured-data';
import { COMPETITORS } from '@/lib/er/competitors';
import { avaGuidePath } from '@/lib/seo/receptionist-home';
import { executiveReceptionistUrl } from '@/lib/site-url';

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
              <article key={column.title} className={column.title === 'Executive Receptionist' ? 'ava-choice' : undefined}>
                <small>{column.title}</small>
                <h3>{column.title}</h3>
                <p>{column.body}</p>
              </article>
            ))}
          </div>
          <CostTable guide={guide} />
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

function CostTable({ guide }: { guide: AvaGuide }) {
  if (!guide.costRows?.length) return null;
  return (
    <div className="cost-table-wrap">
      <h3>Published costs, side by side</h3>
      <div className="cost-table-scroll">
        <table className="cost-table">
          <thead>
            <tr>
              <th scope="col">Option</th>
              <th scope="col">What it costs</th>
              <th scope="col">What you get</th>
            </tr>
          </thead>
          <tbody>
            {guide.costRows.map((row) => (
              <tr key={row.option}>
                <td>{row.option}</td>
                <td>{row.cost}</td>
                <td>{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {guide.costNote ? <p className="cost-table-note">{guide.costNote}</p> : null}
    </div>
  );
}

function CityNotes({ guide }: { guide: AvaGuide }) {
  if (!guide.cityNotes?.length) return null;
  return (
    <section className="comparison">
      <div className="section-title">
        <span className="kicker">ALABAMA CITIES</span>
        <h2>The same receptionist, for shops in these cities.</h2>
      </div>
      <div className="comparison-grid">
        {guide.cityNotes.map((city) => (
          <article key={city.city}>
            <small>{city.city}</small>
            <h3>{city.city}</h3>
            <p>{city.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AvaGuidePage({ guide, homeHref }: { guide: AvaGuide; homeHref: string }) {
  const pageUrl = executiveReceptionistUrl(`/ava/${guide.slug}`);
  const liveHref = `${homeHref}#talk-to-ava`;
  const areaServed = (guide.areaServed || []).map((name) =>
    name === 'United States'
      ? { '@type': 'Country', name }
      : name === 'Alabama'
        ? { '@type': 'State', name }
        : { '@type': 'City', name },
  );
  const graph = jsonLdGraph([
    executiveReceptionistOrganization(areaServed.filter((place) => place['@type'] === 'City')),
    avaServiceNode({
      name: guide.title,
      description: guide.description,
      url: pageUrl,
      audience: guide.audience,
      serviceType: 'AI receptionist and call answering',
      areaServed: areaServed.length ? areaServed : undefined,
    }),
    avaProductNode({
      name: guide.title,
      description: guide.description,
      url: pageUrl,
    }),
    faqNode(guide.faqs),
    breadcrumbNode([
      ['Home', '/'],
      [guide.kind === 'trade' ? 'Industries' : 'Ava', guide.kind === 'trade' ? '/industries' : '/ava'],
      [guide.navLabel, `/ava/${guide.slug}`],
    ]),
    howToNode(`How to set up Executive Receptionist for ${guide.audience}`),
  ]);

  return (
    <main className="ava-sales">
      <JsonLd data={graph} />
      <ErTopBars />

      <section className="sales-hero">
        <div className="hero-copy">
          <span className="kicker">{guide.eyebrow}</span>
          <h1>{guide.h1}</h1>
          {guide.directAnswer ? <p className="direct-answer">{guide.directAnswer}</p> : null}
          <p>{guide.lede}</p>
          <p className="trial-line">Starter: first month $1, then $79/month. Pro: 1,200 minutes for $397/month. Cancel anytime.</p>
          <p className="demo-line">
            Hear her now: call <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a>. She answers as {AVA_DEMO_LINE.answersAs}.
          </p>
          <div className="hero-actions">
            <a className="sales-btn" href={AVA_DEMO_LINE.href}>
              <PhoneCall size={18} /> Call the demo line
            </a>
            <TrackedCheckoutLink className="sales-btn secondary" href="/api/checkout?plan=starter" plan="starter">
              Start for $1 <ArrowRight size={18} />
            </TrackedCheckoutLink>
          </div>
          <div className="trust-row">
            <span>
              <Check /> Emails you the lead
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
              <p>Executive Receptionist asks what you approved, then emails you the lead. She does not invent a price.</p>
            </article>
          ))}
        </div>
      </section>

      {guide.kind === 'trade' ? (
        <section className="comparison">
          <div className="section-title">
            <span className="kicker">WHY SHOPS SWITCH</span>
            <h2>Three reasons {guide.audience} use Ava instead of a traditional answering service.</h2>
          </div>
          <div className="comparison-grid">
            <article>
              <small>01</small>
              <h3>One flat monthly price</h3>
              <p>Plans include minutes, from 60 to 2,000 a month. Overflow ($25, 60 minutes) bills $1/min after 60. On Starter and up there is no per-minute overage: past your minutes Ava keeps answering and we reach out about a bigger plan.</p>
            </article>
            <article>
              <small>02</small>
              <h3>Questions written for your trade</h3>
              <p>Your greeting, intake questions and urgent rules are written from your website and notes, so the lead email has what you need to call back.</p>
            </article>
            <article>
              <small>03</small>
              <h3>The same answer at 2 AM</h3>
              <p>Ava answers the calls you forward nights, weekends and mid-job, says she is an AI receptionist, and emails you a summary of every call.</p>
            </article>
          </div>
        </section>
      ) : null}

      <GuideExtra guide={guide} />
      <CityNotes guide={guide} />

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

      <section className="how-section" id="setup">
        <div className="section-title">
          <span className="kicker">SETUP</span>
          <h2>Live on your line in three steps.</h2>
          <p>Keep your number. Setup is included on every plan.</p>
        </div>
        <div className="steps-grid">
          {AVA_SETUP_STEPS.map((step, index) => (
            <article key={step.name}>
              <span>0{index + 1}</span>
              <h3>{step.name}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing" id="pricing">
        <div className="section-title">
          <span className="kicker">PRICING</span>
          <h2>Five monthly plans. $0 setup.</h2>
          <p>
            Checkout is Stripe. Starter&apos;s first month is $1; every other plan bills its monthly price from the first
            month. Included minutes reset each month. Past your minutes, Ava keeps answering and we reach out about a
            bigger plan.
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
                <Link href={avaGuidePath(slug)}>
                  Read it <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
          {COMPETITORS.slice(0, 3).map((c) => (
            <article key={c.slug}>
              <span>Compare</span>
              <h3>Ava vs {c.name}</h3>
              <p>{c.oneLine}</p>
              <Link href={`/compare/${c.slug}`}>
                See the comparison <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <span className="kicker">HEAR IT, THEN START</span>
        <h2>Try the demo, then pick your plan.</h2>
        <p>
          The sample call is a landscaping estimate. You can also call the demo line at {AVA_DEMO_LINE.display},
          where she answers as {AVA_DEMO_LINE.answersAs}. Checkout opens Stripe for the plan you pick. Plans run
          from $25 to $789 a month.
        </p>
        <div>
          <Link className="sales-btn light" href={liveHref}>
            <PhoneCall size={18} /> Try the live demo
          </Link>
          <TrackedCheckoutLink className="sales-btn outline" href="/api/checkout?plan=starter" plan="starter">
            Start for $1
          </TrackedCheckoutLink>
        </div>
      </section>
      <AvaFooter homeHref={homeHref} />
    </main>
  );
}
