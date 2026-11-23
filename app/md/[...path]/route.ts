import { erMarkdownFor } from '@/lib/er/markdown';

/** Serves <page>.md copies of Executive Receptionist pages (rewritten here by next.config) for AI assistants. */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const body = erMarkdownFor(path.join('/'));
  if (!body) return new Response('Not found\n', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Robots-Tag': 'noindex',
      Link: `<https://executivereceptionist.com/${path.join('/')}>; rel="canonical"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
