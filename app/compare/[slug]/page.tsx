import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ErBreadcrumbs, ErShell, erStyles as s } from '@/components/er/ErSite';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { avaSoftwareNode, breadcrumbNode, executiveReceptionistOrganization, faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { AVA_FACTS, COMPETITORS, PRICES_CHECKED_LABEL, getCompetitor } from '@/lib/er/competitors';
import { EXECUTIVE_RECEPTIONIST_ORIGIN } from '@/lib/site-url';

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCompetitor(slug);
  if (!c) return {};
  const canonical = `${EXECUTIVE_RECEPTIONIST_ORIGIN}/compare/${c.slug}`;
  return {
    title: { absolute: c.metaTitle },
    description: c.description,
    alternates: { canonical },
    openGraph: { images: ['/og-default.png'], title: c.metaTitle, description: c.description, url: canonical, siteName: 'Executive Receptionist', type: 'article' },
  };
}

export default async function CompetitorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCompetitor(slug);
  if (!c) notFound();
  const url = `${EXECUTIVE_RECEPTIONIST_ORIGIN}/compare/${c.slug}`;
  const faqs = [
    ...c.faqs,
    {
      q: `When were ${c.name}’s prices checked?`,
      a: `On ${PRICES_CHECKED_LABEL}, from ${c.sourceLabel}. Prices change, so confirm on their page before you buy.`,
    },
    {
      q: 'What does Ava cost?',
      a: 'Overflow $25 a month for 60 minutes ($1/min after 60), Starter $79 a month for 100 minutes (first month $1), Growth $197 for 300, Pro $397 for 1,200, Elite $789 for 2,000. Month to month. No per-minute overage on Starter and up.',
    },
  ];
  const jsonLd = jsonLdGraph([
    executiveReceptionistOrganization(),
    avaSoftwareNode({ description: `Executive Receptionist (Ava) compared with ${c.name}.`, url }),
    breadcrumbNode([
      ['Home', '/'],
      ['Compare', '/compare'],
      [`Ava vs ${c.name}`, `/compare/${c.slug}`],
    ]),
    faqNode(faqs),
  ]);
  const others = COMPETITORS.filter((o) => o.slug !== c.slug);
  return (
    <ErShell jsonLd={jsonLd}>
      <section className={s.hero}>
        <div className={s.wrap}>
          <ErBreadcrumbs items={[['Home', '/'], ['Compare', '/compare'], [`Ava vs ${c.name}`, `/compare/${c.slug}`]]} />
          <p className={s.eyebrow}>{c.kind} comparison</p>
          <h1>Ava vs {c.name}</h1>
          <p className={s.lede}>
            {c.oneLine} Ava is an AI receptionist on flat monthly plans, set up for you, that answers the calls you forward and emails you
            every lead.
          </p>
          <div className={s.actions}>
            <a className={s.btnDark} href={AVA_DEMO_LINE.href}>
              Call the demo: {AVA_DEMO_LINE.display}
            </a>
            <Link className={s.btnLight} href="/pricing">
              See Ava pricing
            </Link>
          </div>
          <p className={s.fine}>Prices checked {PRICES_CHECKED_LABEL}.</p>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <h2>Side by side</h2>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col"> </th>
                  <th scope="col">Executive Receptionist (Ava)</th>
                  <th scope="col">{c.name}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Plans</th>
                  <td>
                    {AVA_FACTS.plans.map((p) => (
                      <div key={p.name}>
                        {p.name}: {p.price}, {p.includes}
                      </div>
                    ))}
                  </td>
                  <td>
                    {c.plans.map((p) => (
                      <div key={p.name}>
                        {p.name}: {p.price}, {p.includes}
                      </div>
                    ))}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Billed by</th>
                  <td>{AVA_FACTS.billing}</td>
                  <td>{c.billing}</td>
                </tr>
                <tr>
                  <th scope="row">Going over</th>
                  <td>{AVA_FACTS.overage}</td>
                  <td>{c.overage}</td>
                </tr>
                <tr>
                  <th scope="row">Trying it</th>
                  <td>{AVA_FACTS.trial}</td>
                  <td>{c.trial}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={s.note}>
            {c.name} prices from <a href={c.sourceUrl} rel="noreferrer">{c.sourceLabel}</a>, checked {PRICES_CHECKED_LABEL}.
          </p>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <h2>What it costs at a typical volume</h2>
          <p>{c.example}</p>
          <p className={s.note}>An example using published prices. Your bill depends on your call count and length.</p>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <h2>Who each one fits</h2>
          <div className={s.two}>
            <div className={s.card}>
              <h3>Where {c.name} is the better pick</h3>
              <ul className={s.list}>
                {c.theyWin.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className={`${s.card} ${s.us}`}>
              <h3>Where Ava is the better pick</h3>
              <ul className={s.list}>
                {c.avaWins.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <h2>What Ava does on every plan</h2>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <tbody>
                {AVA_FACTS.rows.map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row">{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={`${s.section} ${s.faq}`}>
        <div className={s.wrap}>
          <h2>Questions</h2>
          {faqs.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <h2>Other comparisons</h2>
          <ul className={s.grid}>
            {others.map((o) => (
              <li key={o.slug}>
                <Link className={s.card} href={`/compare/${o.slug}`}>
                  <h3>Ava vs {o.name}</h3>
                  <p>{o.oneLine}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </ErShell>
  );
}
