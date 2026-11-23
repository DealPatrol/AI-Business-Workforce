import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ErBreadcrumbs, ErShell, erStyles as s } from '@/components/er/ErSite';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { breadcrumbNode, executiveReceptionistOrganization, jsonLdGraph } from '@/lib/ava/structured-data';
import { CALL_SCRIPTS, getCallScript } from '@/lib/er/call-scripts';
import { erMetadata } from '@/lib/er/page-meta';

export function generateStaticParams() {
  return CALL_SCRIPTS.map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = getCallScript(slug);
  if (!t) return {};
  return erMetadata(`/templates/${t.slug}`, t.metaTitle, t.description);
}

export default async function ScriptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getCallScript(slug);
  if (!t) notFound();
  const path = `/templates/${t.slug}`;
  const jsonLd = jsonLdGraph([
    executiveReceptionistOrganization(),
    {
      '@type': 'HowTo',
      name: t.title,
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Greeting', text: t.greeting },
        ...t.questions.map((q, i) => ({ '@type': 'HowToStep', position: i + 2, name: `Question ${i + 1}`, text: q })),
        { '@type': 'HowToStep', position: t.questions.length + 2, name: 'Close', text: t.close },
      ],
    },
    breadcrumbNode([
      ['Home', '/'],
      ['Call scripts', '/templates'],
      [t.navLabel, path],
    ]),
  ]);
  return (
    <ErShell jsonLd={jsonLd}>
      <section className={s.hero}>
        <div className={s.wrap}>
          <ErBreadcrumbs items={[['Home', '/'], ['Call scripts', '/templates'], [t.navLabel, path]]} />
          <p className={s.eyebrow}>{t.trade} call script</p>
          <h1>{t.title}</h1>
          <p className={s.lede}>{t.blurb} Copy it as-is or change the wording to sound like your shop.</p>
          <p className={s.fine}>
            Hear Ava run a call like this: <a href={AVA_DEMO_LINE.href}>{AVA_DEMO_LINE.display}</a>.
          </p>
        </div>
      </section>
      <section className={s.section}>
        <div className={s.wrap}>
          <h2>Greeting</h2>
          <p className={s.output}>{t.greeting}</p>
          <h2>Questions, in order</h2>
          <ol className={s.list}>
            {t.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
          <h2>Treat as urgent when</h2>
          <ul className={s.list}>
            {t.urgentIf.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
          <h2>Close</h2>
          <p className={s.output}>{t.close}</p>
          <h2>Notes</h2>
          <ul className={s.list}>
            {t.notes.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
          <p className={s.note}>
            See how Ava handles {t.trade.toLowerCase()} calls: <Link href={t.tradeHref}>{t.trade} AI answering service</Link>.
          </p>
        </div>
      </section>
    </ErShell>
  );
}
