import Link from 'next/link';
import { ErBreadcrumbs, ErShell, erStyles as s } from '@/components/er/ErSite';
import { GreetingGenerator } from '@/components/er/tools/GreetingGenerator';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { breadcrumbNode, executiveReceptionistOrganization, faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { erMetadata } from '@/lib/er/page-meta';

const PATH = '/tools/after-hours-greeting-generator';
const FAQS = [
  {
    "q": "How long should an after-hours greeting be?",
    "a": "Under 30 seconds. Say who you are, your hours, what to leave, and when you call back."
  },
  {
    "q": "What if callers hang up instead of leaving a message?",
    "a": "Many urgent callers do. That is the gap an AI receptionist fills: Ava answers, takes the details, and emails them to you."
  }
];

export const metadata = erMetadata(PATH, 'After-Hours Voicemail Greeting Generator (Free)', 'Write a clear after-hours voicemail greeting for your shop: hours, what to leave, emergency line and callback time. Free, no sign-up.');

export default function ToolPage() {
  const jsonLd = jsonLdGraph([
    executiveReceptionistOrganization(),
    { '@type': 'WebApplication', name: 'After-hours greeting generator', url: `https://executivereceptionist.com${PATH}`, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    breadcrumbNode([
      ['Home', '/'],
      ['Free tools', '/tools'],
      ['After-hours greeting generator', PATH],
    ]),
    faqNode(FAQS),
  ]);
  return (
    <ErShell jsonLd={jsonLd}>
      <section className={s.hero}>
        <div className={s.wrap}>
          <ErBreadcrumbs items={[['Home', '/'], ['Free tools', '/tools'], ['After-hours greeting generator', PATH]]} />
          <p className={s.eyebrow}>Free tool</p>
          <h1>Write your after-hours greeting.</h1>
          <p className={s.lede}>Fill in your shop name and hours and copy the greeting. A clear greeting gets you a better message. An answered call gets you the job details while the caller is still on the line.</p>
          <p className={s.fine}>
            Want the calls answered instead? Call the demo line at <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a> or{' '}
            <Link href="/pricing">see pricing</Link>.
          </p>
        </div>
      </section>
      <section className={s.section}>
        <div className={s.wrap}>
          <GreetingGenerator />
        </div>
      </section>
      <section className={`${s.section} ${s.faq}`}>
        <div className={s.wrap}>
          <h2>Questions</h2>
          {FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
          <p className={s.note}>
            <Link href="/tools">More free tools →</Link>
          </p>
        </div>
      </section>
    </ErShell>
  );
}
