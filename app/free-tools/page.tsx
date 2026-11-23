import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { ClosingCards, Crumbs, JsonLd } from '@/components/fpg/Blocks';
import styles from '@/components/fpg/fpg.module.css';
import { breadcrumbNode, fpgMetadata } from '@/lib/fpg/seo';
import { FPG_FREE_TOOLS } from '@/lib/fpg/site';
import { jsonLdGraph } from '@/lib/ava/structured-data';
import { FRONT_PORCH_GROWTH_ORIGIN, absoluteUrl } from '@/lib/site-url';

const PATH = '/free-tools';
export const metadata = fpgMetadata(PATH);

const EXTERNAL = [
  { href: 'https://tryreputationflow.com/', label: 'Google review link and QR code (ReputationFlow)', detail: 'Make a review link or QR code without an account, on the sister site.' },
];

export default function FreeToolsPage() {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Free tools', path: PATH },
  ];
  const data = jsonLdGraph([
    {
      '@type': 'CollectionPage',
      name: 'Free tools',
      url: absoluteUrl(FRONT_PORCH_GROWTH_ORIGIN, PATH),
      hasPart: FPG_FREE_TOOLS.map((t) => ({ '@type': 'WebPage', name: t.label, url: absoluteUrl(FRONT_PORCH_GROWTH_ORIGIN, t.href) })),
    },
    breadcrumbNode(crumbs),
  ]);
  return (
    <SuiteShell>
      <JsonLd data={data} />
      <div className={styles.wrap}>
        <Crumbs items={crumbs} />
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Free tools</span>
          <h1>Free tools for the shop that markets itself.</h1>
          <p className={styles.lede}>Check what Google and AI can read about you, price a mailing, find local businesses, or draft the writing nobody has time for. No card needed.</p>
        </section>
        <section className={styles.section}>
          <ul className={styles.grid3}>
            {FPG_FREE_TOOLS.map((t) => (
              <li key={t.href}>
                <Link className={styles.card} href={t.href}>
                  <h3>{t.label}</h3>
                  <p>{t.detail}</p>
                </Link>
              </li>
            ))}
            {EXTERNAL.map((t) => (
              <li key={t.href}>
                <a className={styles.card} href={t.href}>
                  <h3>{t.label} ↗</h3>
                  <p>{t.detail}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
        <ClosingCards />
      </div>
    </SuiteShell>
  );
}
