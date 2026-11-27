import Link from 'next/link';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { ErBreadcrumbs, ErShell, erStyles as s } from '@/components/er/ErSite';
import { HolidayCoveragePlanner } from '@/components/er/tools/HolidayCoveragePlanner';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { breadcrumbNode, executiveReceptionistOrganization, faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { HOLIDAYS_2026, HOLIDAY_FAQS, HOLIDAY_HOWTO_STEPS, HOLIDAY_PLANNER_PATH as PATH } from '@/lib/er/holiday-coverage';
import { erMetadata } from '@/lib/er/page-meta';

const URL = `https://executivereceptionist.com${PATH}`;

export const metadata = erMetadata(
  PATH,
  'Holiday Call Coverage Planner for Small Shops (Free)',
  'Plan Christmas and New Year’s phone coverage: holiday greeting, call forwarding codes, checklist and receptionist notes. Free, runs in your browser.',
);

export default function HolidayPlannerPage() {
  const jsonLd = jsonLdGraph([
    executiveReceptionistOrganization(),
    {
      '@type': 'WebApplication',
      '@id': `${URL}#app`,
      name: 'Holiday call coverage planner',
      url: URL,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@type': 'HowTo',
      '@id': `${URL}#howto`,
      name: 'How to cover your business phone over Christmas and New Year’s',
      totalTime: 'PT20M',
      step: HOLIDAY_HOWTO_STEPS.map((step, i) => ({ '@type': 'HowToStep', position: i + 1, name: step.name, text: step.text })),
    },
    breadcrumbNode([
      ['Home', '/'],
      ['Free tools', '/tools'],
      ['Holiday call coverage planner', PATH],
    ]),
    faqNode(HOLIDAY_FAQS),
  ]);
  return (
    <ErShell jsonLd={jsonLd}>
      <section className={s.hero}>
        <div className={s.wrap}>
          <ErBreadcrumbs items={[['Home', '/'], ['Free tools', '/tools'], ['Holiday call coverage planner', PATH]]} />
          <p className={s.eyebrow}>Free tool · Christmas &amp; New Year’s 2026</p>
          <h1>Plan who answers your shop phone over the holidays.</h1>
          <p className={s.lede}>
            Short answer: pick the days you are closed, record a holiday greeting, and forward the shop line before you leave on your last open day.
            This planner writes the greeting, the forwarding codes for your carrier, a checklist, and notes for whoever answers.
          </p>
          <p className={s.fine}>
            {HOLIDAYS_2026.map((d) => `${d.label}: ${d.weekday}, ${d.date}`).join(' · ')}
          </p>
        </div>
      </section>
      <section className={s.section}>
        <div className={s.wrap}>
          <HolidayCoveragePlanner />
        </div>
      </section>
      <section className={s.section}>
        <div className={s.wrap}>
          <h2>The six steps</h2>
          <ol className={s.list}>
            {HOLIDAY_HOWTO_STEPS.map((step) => (
              <li key={step.name}>
                <strong>{step.name}.</strong> {step.text}
              </li>
            ))}
          </ol>
          <h2>Want the calls answered instead of a voicemail?</h2>
          <p>
            Forward the holiday calls to Ava. She says she is an AI receptionist, takes the caller’s name, number, address and what they need, puts the
            urgent ones at the top, and emails you a summary after each call. Plans are flat monthly prices with included minutes, the same on
            December 25 as on a Tuesday. Starter is $79 a month and the first month is $1.
          </p>
          <div className={s.actions}>
            <TrackedCheckoutLink className={s.btnDark} href="/api/checkout?plan=starter" plan="starter">
              Start for $1 before the holidays
            </TrackedCheckoutLink>
            <a className={s.btnLight} href={AVA_DEMO_LINE.href}>
              Hear Ava: {AVA_DEMO_LINE.display}
            </a>
          </div>
          <p className={s.fine}>
            The demo line answers as {AVA_DEMO_LINE.answersAs}. <Link href="/pricing">See every plan</Link> or{' '}
            <Link href="/receptionist/book-a-demo">book a 15-minute demo</Link>.
          </p>
        </div>
      </section>
      <section className={`${s.section} ${s.faq}`}>
        <div className={s.wrap}>
          <h2>Questions</h2>
          {HOLIDAY_FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
          <p className={s.note}>
            <Link href="/tools/after-hours-greeting-generator">After-hours greeting generator</Link> ·{' '}
            <Link href="/ava/after-hours-answering-service">After-hours answering service</Link> · <Link href="/tools">More free tools →</Link>
          </p>
        </div>
      </section>
    </ErShell>
  );
}
