import type { Metadata } from 'next';
import Link from 'next/link';
import { ErBreadcrumbs, ErShell, erStyles as s } from '@/components/er/ErSite';
import { breadcrumbNode, executiveReceptionistOrganization, faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { AVA_FACTS, COMPETITORS, PRICES_CHECKED_LABEL } from '@/lib/er/competitors';
import { requestHost } from '@/lib/seo/request-host';
import { FpgCompareHub } from '@/components/fpg/CompareHub';
import { EXECUTIVE_RECEPTIONIST_ORIGIN, isExecutiveReceptionistHost } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

const title = 'Compare AI Receptionists: Ava vs Smith.ai, Ruby, Rosie';
const description = `Ava compared with Smith.ai, Ruby, Goodcall, Rosie, My AI Front Desk and Quo Sona. Prices from each company’s own pricing page, checked ${PRICES_CHECKED_LABEL}.`;
const canonical = `${EXECUTIVE_RECEPTIONIST_ORIGIN}/compare`;

const FAQS = [
  {
    q: 'Where do these prices come from?',
    a: `Each comparison links to the company’s own pricing page. They were read on ${PRICES_CHECKED_LABEL}. Prices change, so check the linked page before you buy.`,
  },
  {
    q: 'Is Ava the cheapest AI receptionist?',
    a: 'No. Several self-serve AI tools cost less per minute. Ava’s plans include setup done for you, trade-specific intake questions, and one flat monthly price with no overage charge.',
  },
];

const FPG_COMPARE_TITLE = 'Compare Front Porch Growth: Postcards, SEO, Reviews';
const FPG_COMPARE_DESCRIPTION =
  'Front Porch Growth next to Local SEO Bot, BrightLocal, PostcardMania, USPS EDDM, AEO Engine, Otterly.ai and NiceJob. Prices from each vendor’s page.';

/**
 * Domain check: executivereceptionist.com gets the Ava comparison hub; frontporchgrowth.com
 * (and previews) get the Front Porch Growth compare hub from components/fpg/CompareHub.
 */
export async function generateMetadata(): Promise<Metadata> {
  if (!isExecutiveReceptionistHost(await requestHost())) {
    return {
      title: { absolute: FPG_COMPARE_TITLE },
      description: FPG_COMPARE_DESCRIPTION,
      alternates: { canonical: '/compare' },
      openGraph: { images: ['/og-default.png'], title: FPG_COMPARE_TITLE, description: FPG_COMPARE_DESCRIPTION, url: '/compare', siteName: 'Front Porch Growth', type: 'website' },
    };
  }
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { images: ['/og-default.png'], title, description, url: canonical, siteName: 'Executive Receptionist', type: 'website' },
  };
}

export default async function ComparePage() {
  if (!isExecutiveReceptionistHost(await requestHost())) return <FpgCompareHub />;
  const jsonLd = jsonLdGraph([
    executiveReceptionistOrganization(),
    breadcrumbNode([
      ['Home', '/'],
      ['Compare', '/compare'],
    ]),
    faqNode(FAQS),
  ]);
  return (
    <ErShell jsonLd={jsonLd}>
      <section className={s.hero}>
        <div className={s.wrap}>
          <ErBreadcrumbs items={[['Home', '/'], ['Compare', '/compare']]} />
          <p className={s.eyebrow}>Compare AI receptionists</p>
          <h1>Ava next to the receptionists you are pricing.</h1>
          <p className={s.lede}>
            Published prices from each company’s own pricing page, checked {PRICES_CHECKED_LABEL}. Where another option is cheaper or does
            something Ava doesn’t, the page says so.
          </p>
        </div>
      </section>
      <section className={s.section}>
        <div className={s.wrap}>
          <h2>Pick a comparison</h2>
          <ul className={s.grid}>
            {COMPETITORS.map((c) => (
              <li key={c.slug}>
                <Link className={s.card} href={`/compare/${c.slug}`}>
                  <h3>Ava vs {c.name}</h3>
                  <p>{c.oneLine}</p>
                  <span>See the comparison →</span>
                </Link>
              </li>
            ))}
            <li>
              <Link className={s.card} href="/ava/ai-receptionist-vs-answering-service">
                <h3>AI receptionist vs answering service</h3>
                <p>What you actually buy with each, and the cost math.</p>
                <span>Read the guide →</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
      <section className={s.section}>
        <div className={s.wrap}>
          <h2>Starting prices at a glance</h2>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Company</th>
                  <th scope="col">Type</th>
                  <th scope="col">Published plans</th>
                  <th scope="col">Billed by</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Executive Receptionist (Ava)</th>
                  <td>AI receptionist, setup done for you</td>
                  <td>{AVA_FACTS.plans.map((p) => `${p.name} ${p.price}`).join('; ')}</td>
                  <td>{AVA_FACTS.billing}</td>
                </tr>
                {COMPETITORS.map((c) => (
                  <tr key={c.slug}>
                    <th scope="row">
                      <Link href={`/compare/${c.slug}`}>{c.name}</Link>
                    </th>
                    <td>{c.kind}</td>
                    <td>{c.plans.map((p) => `${p.name}: ${p.price}`).join('; ')}</td>
                    <td>{c.billing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={s.note}>Prices checked {PRICES_CHECKED_LABEL} on each company’s own pricing page. Each comparison links its source.</p>
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
        </div>
      </section>
    </ErShell>
  );
}
