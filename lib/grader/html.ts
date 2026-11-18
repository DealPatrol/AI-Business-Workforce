/** Small, dependency-free HTML helpers for the grader. Regex based on purpose: we only read. */

const ENTITY: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  hellip: '…',
};

export function decodeEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : whole;
    }
    return ENTITY[code.toLowerCase()] ?? whole;
  });
}

export function collapse(value: string) {
  return decodeEntities(value).replace(/\s+/g, ' ').trim();
}

export function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const inner = tag.replace(/^<\s*[a-z0-9-]+/i, '').replace(/\/?>$/, '');
  const re = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(inner))) {
    const name = match[1].toLowerCase();
    if (name in attrs) continue;
    attrs[name] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

export function tags(html: string, name: string): Array<Record<string, string>> {
  const re = new RegExp(`<${name}\\b[^>]*>`, 'gi');
  return (html.match(re) || []).map(parseAttributes);
}

export function stripNonContent(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ');
}

export function visibleText(html: string) {
  return collapse(stripNonContent(html).replace(/<[^>]+>/g, ' '));
}

export function elementTexts(html: string, name: string): string[] {
  const re = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'gi');
  const out: string[] = [];
  let match: RegExpExecArray | null;
  const cleaned = stripNonContent(html);
  while ((match = re.exec(cleaned))) out.push(collapse(match[1].replace(/<[^>]+>/g, ' ')));
  return out;
}

export function titleOf(html: string) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? collapse(match[1]) : '';
}

export function metaBy(html: string, key: 'name' | 'property', value: string): string | null {
  const wanted = value.toLowerCase();
  for (const attrs of tags(html, 'meta')) {
    if ((attrs[key] || '').toLowerCase() === wanted) return collapse(attrs.content ?? '');
  }
  // Some sites put Open Graph tags in name= instead of property=.
  if (key === 'property') {
    for (const attrs of tags(html, 'meta')) {
      if ((attrs.name || '').toLowerCase() === wanted) return collapse(attrs.content ?? '');
    }
  }
  return null;
}

export function linkRel(html: string, rel: string): string | null {
  for (const attrs of tags(html, 'link')) {
    const rels = (attrs.rel || '').toLowerCase().split(/\s+/);
    if (rels.includes(rel)) return attrs.href ?? '';
  }
  return null;
}

/** Every JSON-LD node on the page, with @graph and arrays flattened. Bad JSON is skipped. */
export function jsonLdNodes(html: string): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  const re = /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  const visit = (value: unknown, depth: number) => {
    if (depth > 6 || !value) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }
    if (typeof value !== 'object') return;
    const node = value as Record<string, unknown>;
    if (node['@type']) out.push(node);
    if (node['@graph']) visit(node['@graph'], depth + 1);
    if (node.mainEntity) visit(node.mainEntity, depth + 1);
  };
  while ((match = re.exec(html))) {
    const raw = match[1].trim().replace(/^<!\[CDATA\[|\]\]>$/g, '');
    try {
      visit(JSON.parse(raw), 0);
    } catch {
      // Ignore malformed blocks; the check reports what it could read.
    }
  }
  return out;
}

export function typesOf(node: Record<string, unknown>): string[] {
  const raw = node['@type'];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.filter((item): item is string => typeof item === 'string').map((item) => item.replace(/^https?:\/\/schema\.org\//i, ''));
}
