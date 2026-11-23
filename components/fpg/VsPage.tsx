import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { ClosingCards, Crumbs, FaqList, JsonLd } from '@/components/fpg/Blocks';
import styles from '@/components/fpg/fpg.module.css';
import { FPG_COMPARE_CHECKED, FPG_COMPARE_CHECKED_LABEL, FPG_COMPETITORS, fpgCompetitor } from '@/lib/fpg/competitors';
import { breadcrumbNode } from '@/lib/fpg/seo';
import { ER_COMPARE } from '@/lib/fpg/site';
import { faqNode, frontPorchOrganization, jsonLdGraph } from '@/lib/ava/structured-data';
import { FRONT_PORCH_GROWTH_ORIGIN, absoluteUrl } from '@/lib/site-url';

export function FpgVsPage({ slug }: { slug: string }) {
  const c = fpgCompetitor(slug);
  if (!c) throw new Error(`Unknown competitor ${slug}`);
  const path = `/compare/${c.slug}`;
  const url = absoluteUrl(FRONT_PORCH_GROWTH_ORIGIN, path);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Compare', path: '/compare' },
    { name: c.h1, path },
  ];
  const faqs = [
    ...c.faqs,
    {
      q: `Where do the ${c.name} prices come from?`,
      a: `From ${c.name}’s own public pricing page, checked ${FPG_COMPARE_CHECKED_LABEL}. Prices change, so follow the source link before you decide.`,
    },
  ];
  const data = jsonLdGraph([
    frontPorchOrganization(),
    {
      '@type': 'WebPage',
      '@id': `${url}#page`,
      url,
      name: c.title,
      description: c.description,
      dateModified: FPG_COMPARE_CHECKED,
      about: [
        { '@type': 'Service', name: c.ourProduct, provider: { '@id': `${FRONT_PORCH_GROWTH_ORIGIN}/#org` }, url: absoluteUrl(FRONT_PORCH_GROWTH_ORIGIN, c.ourHref) },
        { '@type': 'Organization', name: c.name, url: c.sources[0]?.url },
      ],
    },
    breadcrumbNode(crumbs),
    faqNode(faqs),
  ]);
  const others = FPG_COMPETITORS.filter((o) => o.slug !== c.slug);

  return (
    <SuiteShell>
      <JsonLd data={data} />
      <div className={styles.wrap}>
        <Crumbs items={crumbs} />
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Compare · {c.group}</span>
          <h1>{c.h1}</h1>
          <p className={styles.lede}>{c.fit}</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href={c.ourHref}>
              See {c.ourProduct}
            </Link>
            <Link className={styles.secondary} href="/pricing">
              All Front Porch Growth prices
            </Link>
          </div>
          <p className={styles.fine}>Prices checked {FPG_COMPARE_CHECKED_LABEL} from each company’s own page. No ratings or reviews are quoted for either side.</p>
        </section>

        <section className={styles.section}>
          <span className={styles.kicker}>Side by side</span>
          <h2 className={styles.h2}>
            {c.ourProduct} vs {c.name}
          </h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col"> </th>
                  <th scope="col">Front Porch Growth</th>
                  <th scope="col">{c.name}</th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.us}</td>
                    <td>{row.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.fine}>
            Source:{' '}
            {c.sources.map((s, i) => (
              <span key={s.url}>
                {i > 0 ? ' · ' : ''}
                <a href={s.url} rel="nofollow noopener">
                  {s.label}
                </a>
              </span>
            ))}{' '}
            · Last checked {FPG_COMPARE_CHECKED_LABEL}
          </p>
        </section>

        <section className={styles.section}>
          <span className={styles.kicker}>The math</span>
          <h2 className={styles.h2}>{c.costHeading}</h2>
          <ul className={styles.list}>
            {c.costMath.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <span className={styles.kicker}>Straight talk</span>
          <h2 className={styles.h2}>Where each one is the better pick</h2>
          <ul className={styles.grid3}>
            <li className={styles.card}>
              <h3>Pick {c.name} if you want</h3>
              <ul className={styles.list}>
                {c.theyAreBetter.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </li>
            <li className={styles.card}>
              <h3>Pick Front Porch Growth if you want</h3>
              <ul className={styles.list}>
                {c.weAreBetter.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <span className={styles.kicker}>Questions</span>
          <h2 className={styles.h2}>Before you switch</h2>
          <FaqList faqs={faqs} />
        </section>

        <section className={styles.section}>
          <span className={styles.kicker}>More comparisons</span>
          <ul className={styles.linkList}>
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/compare/${o.slug}`}>{o.h1}</Link>
              </li>
            ))}
            <li>
              <a href={ER_COMPARE}>AI receptionist comparisons (Executive Receptionist) ↗</a>
            </li>
          </ul>
        </section>

        <ClosingCards />
      </div>
    </SuiteShell>
  );
}
