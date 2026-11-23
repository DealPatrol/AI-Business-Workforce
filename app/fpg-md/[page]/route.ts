import { fpgMarkdown, FPG_MARKDOWN_PAGES } from '@/lib/fpg/markdown';

export function generateStaticParams() {
  return Object.keys(FPG_MARKDOWN_PAGES).map((name) => ({ page: `${name}.md` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const name = page.endsWith('.md') ? page.slice(0, -3) : '';
  const body = name ? fpgMarkdown(name) : null;
  if (!body) return new Response('Not found', { status: 404 });
  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' },
  });
}
