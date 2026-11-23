import Link from 'next/link';
import type { ReactNode } from 'react';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { ClosingCards, Crumbs, FaqList, JsonLd } from '@/components/fpg/Blocks';
import styles from '@/components/fpg/fpg.module.css';
import { breadcrumbNode, FPG_PAGE_SEO } from '@/lib/fpg/seo';
import { FPG_FREE_TOOLS } from '@/lib/fpg/site';
import { faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { FRONT_PORCH_GROWTH_ORIGIN, absoluteUrl } from '@/lib/site-url';

export function FpgToolPage(props: {
  path: string;
  name: string;
  h1: string;
  lede: string;
  children: ReactNode;
  how: string[];
  faqs: Array<{ q: string; a: string }>;
  next: { href: string; label: string };
}) {
  const seo = FPG_PAGE_SEO[props.path];
  const url = absoluteUrl(FRONT_PORCH_GROWTH_ORIGIN, props.path);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Free tools', path: '/free-tools' },
    { name: props.name, path: props.path },
  ];
  const data = jsonLdGraph([
    {
      '@type': 'WebApplication',
      name: props.name,
      url,
      description: seo?.description,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any (web browser)',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@id': `${FRONT_PORCH_GROWTH_ORIGIN}/#org` },
    },
    breadcrumbNode(crumbs),
    faqNode(props.faqs),
  ]);
  return (
    <SuiteShell>
      <JsonLd data={data} />
      <div className={styles.wrap}>
        <Crumbs items={crumbs} />
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Free tool</span>
          <h1>{props.h1}</h1>
          <p className={styles.lede}>{props.lede}</p>
          {props.children}
        </section>
        <section className={styles.section}>
          <span className={styles.kicker}>How it works</span>
          <h2 className={styles.h2}>What the numbers mean</h2>
          <ul className={styles.list}>
            {props.how.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className={styles.actions}>
            <Link className={styles.primary} href={props.next.href}>
              {props.next.label}
            </Link>
          </div>
        </section>
        <section className={styles.section}>
          <span className={styles.kicker}>Questions</span>
          <FaqList faqs={props.faqs} />
        </section>
        <section className={styles.section}>
          <span className={styles.kicker}>Related free tools</span>
          <ul className={styles.linkList}>
            {FPG_FREE_TOOLS.filter((t) => t.href !== props.path).map((t) => (
              <li key={t.href}>
                <Link href={t.href}>{t.label}</Link>
              </li>
            ))}
          </ul>
        </section>
        <ClosingCards />
      </div>
    </SuiteShell>
  );
}
