import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import robots from '@/app/robots';
import { collectRouteSeo, discoverPageRoutes, seoProblems } from '@/lib/seo/audit';
import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from '@/lib/seo/pages';

const rows = collectRouteSeo();
const problems = seoProblems(rows);

function printTable() {
  const header = `| Path | Title | Chars | Description chars |`;
  const rule = `| --- | --- | ---: | ---: |`;
  const body = rows
    .map((row) => `| ${row.path} | ${row.title.replaceAll('|', '\\|')} | ${row.title.length} | ${row.description.length} |`)
    .join('\n');
  console.log(`# SEO titles (${rows.length} routes, title <= ${SEO_TITLE_MAX}, description <= ${SEO_DESCRIPTION_MAX})\n`);
  console.log([header, rule, body].join('\n'));
}

const isDirectRun = process.argv[1]?.includes('check-seo-metadata');
if (isDirectRun && process.argv.includes('--print')) printTable();

describe('route SEO limits', () => {
  it('covers every app route', () => {
    const routes = discoverPageRoutes();
    assert.ok(routes.includes('/'));
    assert.ok(routes.includes('/ava/[slug]'));
    assert.ok(routes.includes('/receptionist'));
    assert.ok(rows.length >= routes.length);
  });

  it('keeps every rendered title and description within the search snippet limits', () => {
    assert.deepEqual(problems, []);
  });

  it('disallows /api/ in robots.txt', () => {
    const rules = robots().rules;
    const list = Array.isArray(rules) ? rules : [rules];
    const disallows = list.flatMap((rule) => {
      const value = rule.disallow;
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    });
    assert.ok(disallows.includes('/api/'));
  });
});
