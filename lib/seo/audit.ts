import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { AGENTS } from '@/lib/agents/catalog';
import { AVA_GUIDES } from '@/lib/ava/trade-pages';
import { MISSED_CALL_TRADES, missedCallSeo } from '@/lib/dispatch/missed-call-ads';
import { POSTCARD_TRADES, postcardTradeSeo } from '@/lib/postcards/trade-pages';
import {
  AI_RECEPTIONIST,
  DEMO_NOT_FOUND_SEO,
  PRIVATE_DEMO_SEO,
  ROOT_SEO,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  agentDocumentTitle,
  demoDocumentDescription,
  demoDocumentTitle,
  isStaticSeoPath,
  pageSeo,
  renderedTitle,
  type SeoSpec,
} from '@/lib/seo/pages';
import { TRADE_PAGES } from '@/lib/trades/pages';

export type ResolvedSeo = {
  path: string;
  title: string;
  description: string;
  receptionist: boolean;
};

function fromSpec(route: string, spec: SeoSpec): ResolvedSeo {
  return {
    path: route,
    title: renderedTitle(spec),
    description: spec.description,
    receptionist: spec.receptionist,
  };
}

function absolute(route: string, title: string, description: string, receptionist: boolean): ResolvedSeo {
  return { path: route, title, description, receptionist };
}

export function discoverPageRoutes(root = process.cwd()) {
  const appDir = path.join(root, 'app');
  const routes: string[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (entry !== 'page.tsx' && entry !== 'page.ts') continue;
      const rel = path.relative(appDir, full).replace(/\\/g, '/').replace(/\/?page\.tsx$/, '').replace(/\/?page\.ts$/, '');
      routes.push(rel ? `/${rel}` : '/');
    }
  }

  walk(appDir);
  return routes.sort();
}

export function companyNamesFromProspects(root = process.cwd()) {
  const source = readFileSync(path.join(root, 'lib/prospects.ts'), 'utf8');
  return [...source.matchAll(/companyName:\s*'([^']+)'/g)].map((match) => match[1] || '');
}

export function resolveRouteSeo(route: string, companyNames: string[]): ResolvedSeo[] {
  if (isStaticSeoPath(route)) return [fromSpec(route, pageSeo(route))];

  if (route === '/ava/[slug]') {
    return AVA_GUIDES.map((guide) => absolute(`/ava/${guide.slug}`, guide.metaTitle, guide.description, true));
  }

  if (route === '/postcards/[trade]') {
    return POSTCARD_TRADES.map((trade) => {
      const seo = postcardTradeSeo(trade.slug);
      if (!seo) throw new Error(`Missing postcard SEO for ${trade.slug}`);
      return absolute(`/postcards/${trade.slug}`, seo.title, seo.description, false);
    });
  }

  if (route === '/trades/[slug]') {
    return TRADE_PAGES.map((page) => absolute(`/trades/${page.slug}`, page.title, page.description, false));
  }

  if (route === '/agents/[slug]') {
    return AGENTS.map((agent) => absolute(`/agents/${agent.id}`, agentDocumentTitle(agent.title), agent.blurb, false));
  }

  if (route === '/receptionist/missed-calls') {
    return MISSED_CALL_TRADES.map((trade) => {
      const seo = missedCallSeo(trade);
      const suffix = trade === 'hvac' ? '' : `?trade=${trade}`;
      return absolute(`${route}${suffix}`, seo.title, seo.description, true);
    });
  }

  if (route === '/demo/[slug]') {
    const names = companyNames.filter(Boolean);
    return [
      fromSpec('/demo/[slug] private', PRIVATE_DEMO_SEO),
      fromSpec('/demo/[slug] missing', DEMO_NOT_FOUND_SEO),
      ...names.map((name) => absolute(`/demo/${name}`, demoDocumentTitle(name), demoDocumentDescription(name), true)),
    ];
  }

  if (route === '/property-demo/postcard' || route.startsWith('/property-demo/')) {
    return [fromSpec(route, pageSeo('/property-demo'))];
  }

  if (route.startsWith('/property/')) return [fromSpec(route, pageSeo('/property/[postcode]'))];
  if (route === '/audit' || route.startsWith('/audit/')) return [fromSpec(route, pageSeo('/audit'))];

  return [fromSpec(route, ROOT_SEO)];
}

export function collectRouteSeo(root = process.cwd()) {
  const companies = companyNamesFromProspects(root);
  return discoverPageRoutes(root).flatMap((route) => resolveRouteSeo(route, companies));
}

export function seoProblems(rows: ResolvedSeo[]) {
  const problems: string[] = [];
  for (const row of rows) {
    if (row.title.length > SEO_TITLE_MAX) problems.push(`${row.path} title is ${row.title.length} chars: ${row.title}`);
    if (row.description.length > SEO_DESCRIPTION_MAX) {
      problems.push(`${row.path} description is ${row.description.length} chars`);
    }
    const brands = row.title.split('Front Porch Growth').length - 1;
    if (brands > 1) problems.push(`${row.path} doubles Front Porch Growth: ${row.title}`);
    if (row.receptionist && !row.title.includes(AI_RECEPTIONIST)) {
      problems.push(`${row.path} title does not include ${AI_RECEPTIONIST}: ${row.title}`);
    }
    if (!row.title.trim()) problems.push(`${row.path} has an empty title`);
    if (!row.description.trim()) problems.push(`${row.path} has an empty description`);
  }
  return problems;
}
