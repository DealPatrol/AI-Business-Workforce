import Link from 'next/link';
import { ErBreadcrumbs, ErShell, erStyles as s } from '@/components/er/ErSite';
import { ForwardingCodes } from '@/components/er/tools/ForwardingCodes';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { breadcrumbNode, executiveReceptionistOrganization, faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { erMetadata } from '@/lib/er/page-meta';

const PATH = '/tools/call-forwarding-codes';
const FAQS = [
  {
    "q": "Can I forward only the calls I miss?",
    "a": "Yes, on Verizon (*71 plus the number) and T-Mobile (the no-reply code). On AT&T, pick When unanswered in your phone’s call forwarding settings, if your phone offers it."
  },
  {
    "q": "Will I keep my number?",
    "a": "Yes. Forwarding sends calls on to another number. Your number and carrier stay the same, and you can turn it off with the off code."
  },
  {
    "q": "Does forwarding replace my voicemail?",
    "a": "AT&T’s page says call forwarding overrides your wireless voicemail. Forwarded unanswered calls go to the new number instead."
  }
];

export const metadata = erMetadata(PATH, 'Call Forwarding Codes: Verizon, T-Mobile, AT&T Steps', 'How to forward unanswered or all calls on Verizon and T-Mobile, with codes from each carrier’s own support page, plus AT&T’s settings steps.');

export default function ToolPage() {
  const jsonLd = jsonLdGraph([
    executiveReceptionistOrganization(),
    { '@type': 'WebApplication', name: 'Call forwarding codes', url: `https://executivereceptionist.com${PATH}`, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    breadcrumbNode([
      ['Home', '/'],
      ['Free tools', '/tools'],
      ['Call forwarding codes', PATH],
    ]),
    faqNode(FAQS),
  ]);
  return (
    <ErShell jsonLd={jsonLd}>
      <section className={s.hero}>
        <div className={s.wrap}>
          <ErBreadcrumbs items={[['Home', '/'], ['Free tools', '/tools'], ['Call forwarding codes', PATH]]} />
          <p className={s.eyebrow}>Free tool</p>
          <h1>Call forwarding codes for your carrier.</h1>
          <p className={s.lede}>Type the number you want calls sent to and pick your carrier. Verizon and T-Mobile codes are copied from their own support pages; AT&T does not publish codes, so you get its settings steps instead. Checked November 22, 2026.</p>
          <p className={s.fine}>
            Want the calls answered instead? Call the demo line at <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a> or{' '}
            <Link href="/pricing">see pricing</Link>.
          </p>
        </div>
      </section>
      <section className={s.section}>
        <div className={s.wrap}>
          <ForwardingCodes />
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
