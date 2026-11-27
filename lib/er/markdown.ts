import { AVA_GUIDES, getAvaGuide } from '@/lib/ava/trade-pages';
import { MERGED_AVA_GUIDES } from '@/lib/seo/receptionist-home';
import { CALL_SCRIPTS, getCallScript } from '@/lib/er/call-scripts';
import { AVA_FACTS, COMPETITORS, getCompetitor, PRICES_CHECKED_LABEL } from '@/lib/er/competitors';
import { CARRIERS, ER_TOOLS, FORWARDING_CHECKED } from '@/lib/er/tools';
import { HOLIDAYS_2026, HOLIDAY_FAQS, HOLIDAY_HOWTO_STEPS } from '@/lib/er/holiday-coverage';

/**
 * Plain-Markdown copies of Executive Receptionist pages for AI assistants (served at <page>.md
 * and listed in llms.txt). Built from the same data as the HTML pages, so they never drift.
 */
const ER = 'https://executivereceptionist.com';
const FOOT = `\n---\nExecutive Receptionist (Ava) · Hanceville, Alabama · (256) 595-3354 · Demo line (256) 952-4935\nPlans: ${AVA_FACTS.plans.map((p) => `${p.name} ${p.price}, ${p.includes}`).join('; ')}. ${AVA_FACTS.overage}\n`;

const list = (items: string[]) => items.map((i) => `- ${i}`).join('\n');
const faqs = (rows: { q: string; a: string }[]) => rows.map((f) => `### ${f.q}\n${f.a}`).join('\n\n');

function guideMd(slug: string) {
  const g = getAvaGuide(slug);
  if (!g || slug in MERGED_AVA_GUIDES) return null;
  const cities = (g.cityNotes ?? []).map((c) => `## ${c.city}\n${c.body}`).join('\n\n');
  return `# ${g.h1}\n\nCanonical: ${ER}/ava/${g.slug}\n\n${g.directAnswer ?? ''}\n\n${g.lede}\n\n${g.pain}\n\n## Calls Ava handles\n${list(g.calls)}\n\n## What she asks\n${list(g.qualification)}\n\n## ${g.roiTitle}\n${g.roiBody}\n\n${cities}\n\n## FAQ\n${faqs(g.faqs)}\n${FOOT}`;
}

function compareMd(slug: string) {
  const c = getCompetitor(slug);
  if (!c) return null;
  return `# Ava vs ${c.name}\n\nCanonical: ${ER}/compare/${c.slug}\n\n${c.oneLine}\n\n## ${c.name} published pricing (checked ${PRICES_CHECKED_LABEL})\nSource: ${c.sourceUrl}\n${c.plans.map((p) => `- ${p.name}: ${p.price}, ${p.includes}`).join('\n')}\n- Billing: ${c.billing}\n- Overage: ${c.overage}\n- Trial: ${c.trial}\n\n## Executive Receptionist pricing\n${AVA_FACTS.plans.map((p) => `- ${p.name}: ${p.price}, ${p.includes}`).join('\n')}\n- ${AVA_FACTS.overage}\n\n## Example\n${c.example}\n\n## Where ${c.name} fits better\n${list(c.theyWin)}\n\n## Where Ava fits better\n${list(c.avaWins)}\n\n## FAQ\n${faqs(c.faqs)}\n${FOOT}`;
}

const compareHubMd = () =>
  `# Compare Ava with other receptionists\n\nCanonical: ${ER}/compare\n\nPrices read from each company's own pricing page on ${PRICES_CHECKED_LABEL}.\n\n${COMPETITORS.map((c) => `- [Ava vs ${c.name}](${ER}/compare/${c.slug}): ${c.oneLine}`).join('\n')}\n${FOOT}`;

function industriesMd() {
  const guides = AVA_GUIDES.filter((g) => g.kind === 'trade' && !(g.slug in MERGED_AVA_GUIDES));
  return `# Industries Ava answers for\n\nCanonical: ${ER}/industries\n\n- [HVAC](${ER}/hvac)\n${guides.map((g) => `- [${g.navLabel}](${ER}/ava/${g.slug}): ${g.blurb}`).join('\n')}\n${FOOT}`;
}

const toolsMd = () => `# Free tools\n\nCanonical: ${ER}/tools\n\n${ER_TOOLS.map((t) => `- [${t.label}](${ER}${t.href}): ${t.blurb}`).join('\n')}\n${FOOT}`;

function forwardingMd() {
  const body = CARRIERS.map((c) => {
    const rows = c.codes.length
      ? c.codes.map((code) => `- ${code.what}: dial ${code.on('[10-digit number]')}; turn off with ${code.off}`).join('\n')
      : list(c.steps ?? []);
    return `## ${c.carrier}\nSource: ${c.sourceUrl}\n${c.note}\n${rows}`;
  }).join('\n\n');
  return `# Call forwarding codes\n\nCanonical: ${ER}/tools/call-forwarding-codes\n\nChecked against each carrier's own support page on ${FORWARDING_CHECKED}. Only carriers with an official page are listed.\n\n${body}\n${FOOT}`;
}

const holidayMd = () =>
  `# Holiday call coverage planner (Christmas and New Year's 2026)\n\nCanonical: ${ER}/tools/holiday-call-coverage-planner\n\nShort answer: pick the days you are closed, record a holiday greeting, and forward the shop line before you leave on your last open day. Turn forwarding off when you reopen.\n\n## Dates\n${list(HOLIDAYS_2026.map((d) => `${d.label}: ${d.weekday}, ${d.date}`))}\n\n## Steps\n${HOLIDAY_HOWTO_STEPS.map((step, i) => `${i + 1}. ${step.name}: ${step.text}`).join('\n')}\n\n## FAQ\n${faqs(HOLIDAY_FAQS)}\n${FOOT}`;

function scriptMd(slug: string) {
  const s = getCallScript(slug);
  if (!s) return null;
  return `# ${s.title}\n\nCanonical: ${ER}/templates/${s.slug}\n\n## Greeting\n${s.greeting}\n\n## Questions\n${s.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n## Treat as urgent if\n${list(s.urgentIf)}\n\n## Close\n${s.close}\n\n## Notes\n${list(s.notes)}\n${FOOT}`;
}

const templatesMd = () => `# Call scripts\n\nCanonical: ${ER}/templates\n\n${CALL_SCRIPTS.map((s) => `- [${s.title}](${ER}/templates/${s.slug}): ${s.blurb}`).join('\n')}\n${FOOT}`;

/** Markdown for a page path such as "compare/ava-vs-ruby", or null when there is no copy. */
export function erMarkdownFor(path: string): string | null {
  const [head, slug, extra] = path.replace(/^\/+|\/+$/g, '').split('/');
  if (extra) return null;
  if (head === 'compare') return slug ? compareMd(slug) : compareHubMd();
  if (head === 'industries' && !slug) return industriesMd();
  if (head === 'tools') return !slug ? toolsMd() : slug === 'call-forwarding-codes' ? forwardingMd() : slug === 'holiday-call-coverage-planner' ? holidayMd() : null;
  if (head === 'templates') return slug ? scriptMd(slug) : templatesMd();
  if (head === 'ava' && slug) return guideMd(slug);
  return null;
}

/** Every page that has a Markdown copy, for llms.txt. */
export function erMarkdownPaths() {
  return [
    '/industries',
    '/compare',
    ...COMPETITORS.map((c) => `/compare/${c.slug}`),
    '/tools',
    '/tools/call-forwarding-codes',
    '/tools/holiday-call-coverage-planner',
    '/templates',
    ...CALL_SCRIPTS.map((s) => `/templates/${s.slug}`),
    ...AVA_GUIDES.filter((g) => !(g.slug in MERGED_AVA_GUIDES)).map((g) => `/ava/${g.slug}`),
  ];
}
