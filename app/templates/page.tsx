import Link from 'next/link';
import { ErBreadcrumbs, ErShell, erStyles as s } from '@/components/er/ErSite';
import { breadcrumbNode, executiveReceptionistOrganization, jsonLdGraph } from '@/lib/ava/structured-data';
import { CALL_SCRIPTS } from '@/lib/er/call-scripts';
import { erMetadata } from '@/lib/er/page-meta';

export const metadata = erMetadata(
  '/templates',
  'Free Call Scripts for HVAC, Plumbing and Roofing',
  'Free after-hours and emergency call scripts for home-service shops: greeting, intake questions, urgent rules and close. Use them with any answering setup.',
);

export default function TemplatesPage() {
  const jsonLd = jsonLdGraph([
    executiveReceptionistOrganization(),
    breadcrumbNode([
      ['Home', '/'],
      ['Call scripts', '/templates'],
    ]),
  ]);
  return (
    <ErShell jsonLd={jsonLd}>
      <section className={s.hero}>
        <div className={s.wrap}>
          <ErBreadcrumbs items={[['Home', '/'], ['Call scripts', '/templates']]} />
          <p className={s.eyebrow}>Free call scripts</p>
          <h1>Call scripts for the calls that can’t wait.</h1>
          <p className={s.lede}>Copy them for your office, your answering service, or the phone in your truck. These are the same kinds of questions Ava asks.</p>
        </div>
      </section>
      <section className={s.section}>
        <div className={s.wrap}>
          <ul className={s.grid}>
            {CALL_SCRIPTS.map((t) => (
              <li key={t.slug}>
                <Link className={s.card} href={`/templates/${t.slug}`}>
                  <h3>{t.navLabel}</h3>
                  <p>{t.blurb}</p>
                  <span>Read the script →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </ErShell>
  );
}
