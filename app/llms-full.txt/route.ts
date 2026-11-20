import { llmsFullTxtForHost } from '@/lib/seo/llms-txt';
import { requestHost } from '@/lib/seo/request-host';

export const dynamic = 'force-dynamic';

export async function GET() {
  const body = llmsFullTxtForHost(await requestHost());
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
