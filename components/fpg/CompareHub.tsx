import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { ClosingCards, Crumbs, FaqList, JsonLd } from '@/components/fpg/Blocks';
import styles from '@/components/fpg/fpg.module.css';
import { FPG_COMPARE_CHECKED_LABEL, FPG_COMPETITORS } from '@/lib/fpg/competitors';
import { breadcrumbNode } from '@/lib/fpg/seo';
import { ER_COMPARE, ER_PRICING } from '@/lib/fpg/site';
import { faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { FRONT_PORCH_GROWTH_ORIGIN, absoluteUrl } from '@/lib/site-url';

const GROUPS = ['Google profile & local SEO', 'Postcards', 'AI search', 'Reviews'] as const;

const FAQS = [
  {
    q: 'Where do the competitor prices come from?',
    a: `Each comparison links to the company’s own pricing page, checked ${FPG_COMPARE_CHECKED_LABEL}. When a page did not publish a dollar amount, the comparison says so instead of guessing.`,
  },
  {
    q: 'Where are the AI receptionist comparisons?',
    a: 'On Executive Receptionist, the sister site that sells the AI receptionist. Front Porch Growth does not republish receptionist pricing or comparisons.',
  },
  {
    q: 'Is Front Porch Growth a replacement for ServiceTitan, Jobber or Housecall Pro?',
    a: 'No. Those are field-service systems for scheduling, dispatch and invoicing. Front Porch Growth sells marketing: postcards, Google profile setup, AI search visibility and review requests.',
  },
];

export function FpgCompareHub() {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Compare', path: '/compare' },
  ];
  const data = jsonLdGraph([
    {
      '@type': 'CollectionPage',
      name: 'Compare Front Porch Growth',
      url: absoluteUrl(FRONT_PORCH_GROWTH_ORIGIN, '/compare'),
      hasPart: FPG_COMPETITORS.map((c) => ({ '@type': 'WebPage', name: c.title, url: absoluteUrl(FRONT_PORCH_GROWTH_ORIGIN, `/compare/${c.slug}`) })),
    },
    breadcrumbNode(crumbs),
    faqNode(FAQS),
  ]);
  return (
    <SuiteShell>
      <JsonLd data={data} />
      <div className={styles.wrap}>
        <Crumbs items={crumbs} />
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Compare</span>
          <h1>Front Porch Growth next to the tools you’re weighing.</h1>
          <p className={styles.lede}>
            Honest side-by-sides for postcards, Google profile setup, AI search visibility and review requests. Every competitor price comes from
            their own page, checked {FPG_COMPARE_CHECKED_LABEL}, and each page says where the other option is the better pick.
          </p>
        </section>

        <section className={styles.section}>
          <span className={styles.kicker}>At a glance</span>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Comparison</th>
                  <th scope="col">Front Porch Growth</th>
                  <th scope="col">Their published price</th>
                </tr>
              </thead>
              <tbody>
                {FPG_COMPETITORS.map((c) => (
                  <tr key={c.slug}>
                    <td>
                      <Link href={`/compare/${c.slug}`}>{c.h1}</Link>
                    </td>
                    <td>{c.rows[0]?.us}</td>
                    <td>{c.rows[0]?.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {GROUPS.map((group) => (
          <section className={styles.section} key={group}>
            <span className={styles.kicker}>{group}</span>
            <ul className={styles.grid3}>
              {FPG_COMPETITORS.filter((c) => c.group === group).map((c) => (
                <li key={c.slug}>
                  <Link className={styles.card} href={`/compare/${c.slug}`}>
                    <h3>{c.h1}</h3>
                    <p>{c.fit}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className={styles.section}>
          <span className={styles.kicker}>AI receptionist</span>
          <h2 className={styles.h2}>Comparing AI receptionists or answering services?</h2>
          <p className={styles.body}>
            That product is Executive Receptionist, a sister brand. Its comparisons and plans live on its own site: <a href={ER_COMPARE}>receptionist comparisons</a> and{' '}
            <a href={ER_PRICING}>receptionist pricing</a>.
          </p>
        </section>

        <section className={styles.section}>
          <span className={styles.kicker}>Questions</span>
          <FaqList faqs={FAQS} />
        </section>
        <ClosingCards />
      </div>
    </SuiteShell>
  );
}
