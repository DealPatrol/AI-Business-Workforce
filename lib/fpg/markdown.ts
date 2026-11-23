/**
 * Plain-markdown copies of Front Porch Growth pages for AI assistants, listed in llms.txt
 * (the Quo-style ".md mirror" pattern). Built from the same data the pages render.
 */
import { FPG_COMPARE_CHECKED_LABEL, FPG_COMPETITORS } from '@/lib/fpg/competitors';
import { fpgPriceRowsData } from '@/lib/fpg/prices';
import { ER_HOME, FPG_FREE_TOOLS, FPG_PUBLIC_PHONE, FPG_SERVICES, fpgIndustries } from '@/lib/fpg/site';

const ORIGIN = 'https://frontporchgrowth.com';
const abs = (href: string) => (href.startsWith('http') ? href : `${ORIGIN}${href}`);

function home() {
  return `# Front Porch Growth

> Marketing services for home-service shops, run by Cole Collins in Hanceville, Alabama. Phone ${FPG_PUBLIC_PHONE}.

Canonical page: ${ORIGIN}/

## Services
${FPG_SERVICES.map((s) => `- [${s.label}](${abs(s.href)}): ${s.detail} Price: ${s.price}.`).join('\n')}

## Free tools
${FPG_FREE_TOOLS.map((t) => `- [${t.label}](${abs(t.href)}): ${t.detail}`).join('\n')}

## How it works
1. Start free: grade your site or request the free AI Competitor Gap Report.
2. Pick one service.
3. Approve the work before anything is mailed or published.
4. See what happened: QR estimate requests, review links and the AI search log.

## Not offered
- No ranking guarantees, no review gating, no mail sent without approval.
- The AI receptionist is a separate brand: [Executive Receptionist](${ER_HOME}).
`;
}

function pricing() {
  return `# Front Porch Growth pricing

Canonical page: ${ORIGIN}/pricing

| Service | What you get | Price | Billing |
| --- | --- | --- | --- |
${fpgPriceRowsData().map((r) => `| ${r.product} | ${r.what} | ${r.price} | ${r.billing} |`).join('\n')}

AI receptionist plans belong to the sister brand Executive Receptionist: ${ER_HOME}pricing
`;
}

function compareHub() {
  return `# Compare Front Porch Growth

Canonical page: ${ORIGIN}/compare
Competitor prices checked ${FPG_COMPARE_CHECKED_LABEL} from each company's own page.

${FPG_COMPETITORS.map((c) => `- [${c.h1}](${ORIGIN}/compare/${c.slug}) (markdown: ${ORIGIN}/fpg-md/${c.slug}.md): ${c.rows[0]?.us} vs ${c.rows[0]?.them}`).join('\n')}
`;
}

function vs(slug: string) {
  const c = FPG_COMPETITORS.find((x) => x.slug === slug);
  if (!c) return null;
  return `# ${c.h1}

Canonical page: ${ORIGIN}/compare/${c.slug}
Prices checked ${FPG_COMPARE_CHECKED_LABEL}. Sources: ${c.sources.map((s) => s.url).join(', ')}

${c.fit}

| | Front Porch Growth | ${c.name} |
| --- | --- | --- |
${c.rows.map((r) => `| ${r.label} | ${r.us} | ${r.them} |`).join('\n')}

## ${c.costHeading}
${c.costMath.map((l) => `- ${l}`).join('\n')}

## Pick ${c.name} if you want
${c.theyAreBetter.map((l) => `- ${l}`).join('\n')}

## Pick Front Porch Growth if you want
${c.weAreBetter.map((l) => `- ${l}`).join('\n')}

## FAQ
${c.faqs.map((f) => `**${f.q}** ${f.a}`).join('\n\n')}
`;
}

function industries() {
  return `# Industries

Canonical page: ${ORIGIN}/trades

${fpgIndustries().map((i) => `- [${i.label}](${abs(i.href)})`).join('\n')}
- [Roofers: AI search visibility](${ORIGIN}/ai-search-visibility)
`;
}

function tools() {
  return `# Free tools

Canonical page: ${ORIGIN}/free-tools

${FPG_FREE_TOOLS.map((t) => `- [${t.label}](${abs(t.href)}): ${t.detail}`).join('\n')}

Postcard cost formula: $127 setup (first order only) + cards x $3.54 (4x6) or $4.95 (6x9), postage included. USPS EDDM Retail postage reference: $0.260 per piece.
Break-even formula: jobs = ceil(mailing cost / (job value x gross margin)). No response rate is assumed.
`;
}

export const FPG_MARKDOWN_PAGES: Record<string, () => string | null> = {
  home,
  pricing,
  compare: compareHub,
  trades: industries,
  'free-tools': tools,
  ...Object.fromEntries(FPG_COMPETITORS.map((c) => [c.slug, () => vs(c.slug)])),
};

export function fpgMarkdown(name: string) {
  const build = FPG_MARKDOWN_PAGES[name];
  return build ? build() : null;
}
