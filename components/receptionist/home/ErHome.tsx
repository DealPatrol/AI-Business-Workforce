import Link from 'next/link';
import { Suspense } from 'react';
import { IndustryDemo } from '@/components/receptionist/IndustryDemo';
import { PlanCheckoutButton } from '@/components/ava/MonthlyPlans';
import { FaceToFaceWidget } from '@/components/receptionist/live/FaceToFaceWidget';
import { FeatureTabs } from '@/components/receptionist/home/FeatureTabs';
import { RoiCalculator } from '@/components/receptionist/home/RoiCalculator';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { AVA_OFFER, AVA_PLAN_INCLUDES, AVA_PLAN_KEYS, AVA_PLANS } from '@/lib/ava/pricing';
import {
  ER_HOME_COMPARISON,
  ER_HOME_FAQS,
  ER_HOME_FEATURES,
  ER_HOME_STEPS,
  ER_HOME_TRY_LINES,
} from '@/lib/ava/er-home-content';
import { ER_DEMO_NICHES, type ErDemoNiche } from '@/lib/er-demos';
import { liveWidgetEnabled, realFaceEnabled } from '@/lib/live-receptionist/config';
import styles from './er-home.module.css';
import { SisterSites } from '@/components/seo/SisterSites';
import { ErDemoBar, ErFooterColumns } from '@/components/er/ErSite';
import { ErLogoMark } from '@/components/er/ErLogoMark';
import { ER_NAV } from '@/lib/er/site-links';

// Transfers are left off the home page list: no live-handoff claims in marketing copy.
const PLAN_INCLUDES = AVA_PLAN_INCLUDES.filter((item) => !/transfer/i.test(item));

const INDUSTRY_LINKS = [
  { href: '/hvac', name: 'HVAC', line: 'No-cool and no-heat calls, after hours and in the middle of a repair.' },
  ...ER_DEMO_NICHES.filter((n) => n.slug !== 'hvac').map((n) => ({
    href: `/receptionist/${n.slug}`,
    name: n.name,
    line: n.line,
  })),
];

export function ErHome({ niche }: { niche?: ErDemoNiche }) {
  const starter = AVA_PLANS.starter;
  return (
    <main className={styles.page}>
      <ErDemoBar />
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            <ErLogoMark className={styles.logoMark} />
            Executive Receptionist
          </Link>
          <nav aria-label="Main" className={styles.navLinks}>
            {ER_NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/desk">Log in</Link>
          </nav>
          <PlanCheckoutButton plan="starter" className={styles.pillDark}>
            {`Start for ${starter.firstMonthLabel || starter.monthlyLabel}`}
          </PlanCheckoutButton>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span className={styles.liveDot} aria-hidden="true" /> AI receptionist for home-service shops
          </p>
          <h1>Never send another caller to voicemail.</h1>
          <p className={styles.lede}>
            Ava is the AI receptionist that answers your business line 24/7. She tells callers she’s AI, takes the
            details, can book the visit into your calendar, and emails you a summary of every call.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.pillDark} href="#demo">
              Talk to Ava now
            </a>
            <a className={styles.pillLight} href="#pricing">
              See pricing
            </a>
          </div>
          <p className={styles.fine}>
            {starter.firstMonthLabel ? `Starter is ${starter.firstMonthLabel} for your first month. ` : ''}Month to month, cancel
            anytime.
          </p>
        </div>

        <aside className={styles.tryCard} aria-label="Try Ava">
          <p className={styles.tryLabel}>Start like a real caller</p>
          <ul className={styles.chips}>
            {ER_HOME_TRY_LINES.map((line) => (
              <li key={line}>
                <a href="#demo">“{line}”</a>
              </li>
            ))}
          </ul>
          <div className={styles.callLine}>
            <p>Or call the demo line</p>
            <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a>
            <small>Ava answers as {AVA_DEMO_LINE.answersAs}. Nothing books a real truck.</small>
          </div>
        </aside>
      </section>

      <section className={styles.section} id="how">
        <div className={styles.head}>
          <h2>Live on your line without learning new software.</h2>
          <p>Three steps. Setup is included on every plan.</p>
        </div>
        <ol className={styles.steps}>
          {ER_HOME_STEPS.map((step, index) => (
            <li key={step.title}>
              <div className={styles.stepMock}>
                <span className={styles.chip}>{step.chip}</span>
                <small>{step.chipNote}</small>
              </div>
              <p className={styles.stepNum}>Step {index + 1}</p>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} id="features">
        <div className={styles.head}>
          <h2>Everything a front desk does on the phone.</h2>
          <p>What Ava handles on every call, on every plan.</p>
        </div>
        <FeatureTabs features={ER_HOME_FEATURES} />
      </section>

      <section className={styles.demoStage} id="demo">
        <div className={styles.head}>
          <h2>Hear it. Then talk to it.</h2>
          <p>
            Pick a trade, play a sample call, then talk to that receptionist in your browser. Each demo is a made-up
            shop. Your browser will ask for your microphone. Prefer the phone? Call{' '}
            <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a>.
          </p>
        </div>
        <Suspense fallback={<p className={styles.fine}>Loading the demo…</p>}>
          <IndustryDemo initialSlug={niche?.slug} />
        </Suspense>
      </section>

      <section className={styles.section} id="compare">
        <div className={styles.head}>
          <h2>More than an answering service. Not just a voicemail box.</h2>
          <p>How Ava compares with what most shops use today.</p>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.compare}>
            <thead>
              <tr>
                <th scope="col">
                  <span className={styles.srOnly}>Feature</span>
                </th>
                {ER_HOME_COMPARISON.columns.map((col, i) => (
                  <th key={col} scope="col" className={i === 2 ? styles.us : undefined}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ER_HOME_COMPARISON.rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {row.values.map((v, i) => (
                    <td key={`${row.label}-${i}`} className={i === 2 ? styles.us : undefined}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} id="pricing">
        <div className={styles.head}>
          <h2>Simple pricing that follows your call volume.</h2>
          <p>
            Same receptionist on every plan. Plans differ by minutes, and Elite adds priority setup. Month to month, no setup fee, no per-minute
            overage.
          </p>
        </div>
        <div className={styles.plans}>
          {AVA_PLAN_KEYS.map((key) => {
            const plan = AVA_PLANS[key];
            return (
              <article key={key} className={plan.featured ? styles.planFeatured : styles.plan}>
                <div className={styles.planTop}>
                  <h3>{plan.label}</h3>
                  {plan.featured ? <span className={styles.popular}>Most popular</span> : null}
                </div>
                <p className={styles.planMinutes}>{plan.minutesLabel} a month</p>
                <p className={styles.planPrice}>
                  <b>{plan.monthlyLabel}</b>/mo
                </p>
                <p className={styles.planPer}>about {plan.perMinuteLabel} included</p>
                {plan.firstMonthLabel ? (
                  <p className={styles.planIntro}>{plan.firstMonthLabel} for your first month</p>
                ) : null}
                <p className={styles.planDesc}>{plan.description}</p>
                {key === 'elite' ? <p className={styles.planExtra}>Priority setup</p> : null}
                <PlanCheckoutButton plan={key} className={plan.featured ? styles.pillDark : styles.pillLight} />
              </article>
            );
          })}
        </div>
        <div className={styles.includes}>
          <h3>Every plan includes</h3>
          <ul>
            {PLAN_INCLUDES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className={styles.fine}>{AVA_OFFER.overageNote}</p>
          <p className={styles.fine}>
            <Link href="/pricing">Full plan details and billing FAQ →</Link>
          </p>
        </div>
      </section>

      <section className={styles.section} id="calculator">
        <div className={styles.head}>
          <h2>What are missed calls costing you?</h2>
          <p>Move the sliders to match your shop. It is your math, not ours.</p>
        </div>
        <RoiCalculator />
      </section>

      <section className={styles.section} id="industries">
        <div className={styles.head}>
          <h2>Built for the trades, ready for other small businesses.</h2>
          <p>Each page has a sample call and a live demo for that kind of shop.</p>
        </div>
        <ul className={styles.industries}>
          {INDUSTRY_LINKS.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <h3>{item.name}</h3>
                <p>{item.line}</p>
                <span>See the demo →</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/business">
              <h3>Any small business</h3>
              <p>Offices, studios, and service companies that miss calls while the owner works.</p>
              <span>Learn more →</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className={styles.section} id="faq">
        <div className={styles.head}>
          <h2>Your questions, answered.</h2>
        </div>
        <div className={styles.faq}>
          {ER_HOME_FAQS.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.closing}>
        <h2>Ava is ready for your next call.</h2>
        <p>Talk to her now, then put her on your line.</p>
        <div className={styles.heroActions}>
          <a className={styles.pillCream} href="#demo">
            Talk to Ava
          </a>
          <PlanCheckoutButton plan="starter" className={styles.pillOutline}>
            {`Start for ${starter.firstMonthLabel || starter.monthlyLabel}`}
          </PlanCheckoutButton>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>
          <p className={styles.logo}>Executive Receptionist</p>
          <p>
            Questions? Call <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a> or email{' '}
            <a href={`mailto:${AVA_OFFER.contactEmail}`}>{AVA_OFFER.contactEmail}</a>.
          </p>
          <p>{AVA_OFFER.footerLine}.</p>
        </div>
        <ErFooterColumns className={styles.footerCols} />
        <SisterSites selfUrl="https://executivereceptionist.com" clusters={['home-services', 'phone']} className={styles.sisterSites} />
      </footer>

      <a className={styles.mobileBar} href="#demo">
        Talk to Ava now
      </a>
      {liveWidgetEnabled() ? <FaceToFaceWidget realFace={realFaceEnabled()} /> : null}
    </main>
  );
}
