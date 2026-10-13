import { NextRequest, NextResponse } from 'next/server';
import { requireCampaignOwner } from '@/lib/imagery/auth';
import { createTestPostcard, lobTestKey, type PostcardSize } from '@/lib/mail/lob';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Sends ONE postcard through Lob TEST mode (nothing is printed or mailed). */
export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;
  let key: string | null;
  try {
    key = lobTestKey();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
  if (!key) return NextResponse.json({ error: 'LOB_API_KEY (test key) is not configured.', configured: false }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const size: PostcardSize = body.size === '6x9' ? '6x9' : '4x6';
  const esc = (s: unknown) => String(s ?? '').replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const before = body.beforeUrl ? `<img src="${esc(body.beforeUrl)}" style="width:50%;height:100%;object-fit:cover">` : '';
  const after = body.afterUrl ? `<img src="${esc(body.afterUrl)}" style="width:50%;height:100%;object-fit:cover">` : '';
  try {
    const result = await createTestPostcard({
      size,
      to: body.to,
      from: body.from,
      frontHtml: `<html><body style="margin:0;display:flex">${before}${after}</body></html>`,
      backHtml: `<html><body style="font-family:sans-serif;padding:0.3in"><h2>${esc(body.headline || 'We just finished a job on your street.')}</h2><p>${esc(body.message || '')}</p></body></html>`,
    });
    return NextResponse.json({ ok: true, mode: 'test', ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
