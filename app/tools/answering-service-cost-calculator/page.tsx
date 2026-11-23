import Link from 'next/link';
import { ErBreadcrumbs, ErShell, erStyles as s } from '@/components/er/ErSite';
import { AnsweringCostCalculator } from '@/components/er/tools/AnsweringCostCalculator';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { breadcrumbNode, executiveReceptionistOrganization, faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { erMetadata } from '@/lib/er/page-meta';

const PATH = '/tools/answering-service-cost-calculator';
const FAQS = [
  {
    "q": "Where do I find the per-minute price?",
    "a": "On the answering service’s pricing page or quote. Some bill by the minute, some by the call, and some add a monthly base fee."
  },
  {
    "q": "Which Ava plan does it pick?",
    "a": "The smallest plan whose included minutes cover your estimate: Starter 100, Growth 300, Pro 1,200 or Elite 2,000."
  }
];

export const metadata = erMetadata(PATH, 'Answering Service Cost Calculator (Free)', 'Enter your call count, call length and a quoted per-minute or per-call price to see the monthly cost, next to Ava’s flat monthly plans.');

export default function ToolPage() {
  const jsonLd = jsonLdGraph([
    executiveReceptionistOrganization(),
    { '@type': 'WebApplication', name: 'Answering service cost calculator', url: `https://executivereceptionist.com${PATH}`, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    breadcrumbNode([
      ['Home', '/'],
      ['Free tools', '/tools'],
      ['Answering service cost calculator', PATH],
    ]),
    faqNode(FAQS),
  ]);
  return (
    <ErShell jsonLd={jsonLd}>
      <section className={s.hero}>
        <div className={s.wrap}>
          <ErBreadcrumbs items={[['Home', '/'], ['Free tools', '/tools'], ['Answering service cost calculator', PATH]]} />
          <p className={s.eyebrow}>Free tool</p>
          <h1>What would an answering service cost you each month?</h1>
          <p className={s.lede}>Put in your call volume and the price from the quote you have. The calculator shows that monthly cost next to the Ava plan that covers your minutes.</p>
          <p className={s.fine}>
            Want the calls answered instead? Call the demo line at <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a> or{' '}
            <Link href="/pricing">see pricing</Link>.
          </p>
        </div>
      </section>
      <section className={s.section}>
        <div className={s.wrap}>
          <AnsweringCostCalculator />
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
