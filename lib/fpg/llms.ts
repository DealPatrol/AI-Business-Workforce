import { FPG_COMPARE_CHECKED_LABEL, FPG_COMPETITORS } from '@/lib/fpg/competitors';
import { FPG_FREE_TOOLS } from '@/lib/fpg/site';
import { FPG_AEO_PAGES } from '@/lib/fpg/aeo-pages';

const ORIGIN = 'https://frontporchgrowth.com';

/** Extra Front Porch Growth section for llms.txt on frontporchgrowth.com: hubs, vs pages, tools, markdown copies. */
export function fpgLlmsSection() {
  const tools = FPG_FREE_TOOLS.map((t) => `- [${t.label}](${ORIGIN}${t.href}): ${t.detail}`).join('\n');
  const vs = FPG_COMPETITORS.map((c) => `- [${c.h1}](${ORIGIN}/compare/${c.slug}) · markdown: ${ORIGIN}/fpg-md/${c.slug}.md`).join('\n');
  const aeo = FPG_AEO_PAGES.map((p) => `- [${p.h1}](${ORIGIN}/ai-search-visibility/${p.slug}): ${p.description}`).join('\n');
  return `## Front Porch Growth pages
- Pricing (all services): ${ORIGIN}/pricing · markdown: ${ORIGIN}/fpg-md/pricing.md
- Industries hub: ${ORIGIN}/trades · markdown: ${ORIGIN}/fpg-md/trades.md
- Compare hub: ${ORIGIN}/compare · markdown: ${ORIGIN}/fpg-md/compare.md (competitor prices checked ${FPG_COMPARE_CHECKED_LABEL})
- Free tools hub: ${ORIGIN}/free-tools · markdown: ${ORIGIN}/fpg-md/free-tools.md
- Home page copy: ${ORIGIN}/fpg-md/home.md

### Free tools
${tools}

### AI search visibility (AEO) guides
- Hub with plans and guarantee: ${ORIGIN}/ai-search-visibility
${aeo}

### Comparisons
${vs}
- AI receptionist comparisons are on Executive Receptionist, not this site.
`;
}
