import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { businessBySlug } from '@/lib/reputation/store';
import { sendResendEmail, escapeHtml } from '@/lib/ava/mail';

export const dynamic = 'force-dynamic';

/** Public: records a page open or an optional private note. Never changes which review links are shown. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const business = await businessBySlug(String(body.slug || ''));
  if (!business) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const admin = createAdminClient();
  const requestId = /^[0-9a-f-]{36}$/i.test(String(body.requestId || '')) ? String(body.requestId) : null;
  if (body.kind === 'open') {
    if (requestId) await admin.from('rf_requests').update({ opened_at: new Date().toISOString() }).eq('id', requestId).is('opened_at', null).eq('business_id', business.id);
    return NextResponse.json({ ok: true });
  }
  const rating = Math.max(1, Math.min(5, Number(body.rating) || 0)) || null;
  const comment = String(body.comment || '').trim().slice(0, 2000);
  if (!comment && !rating) return NextResponse.json({ error: 'Empty.' }, { status: 400 });
  await admin.from('rf_feedback').insert({ business_id: business.id, request_id: requestId, rating, comment: comment || null });
  try {
    await sendResendEmail({
      to: business.owner_email,
      subject: `Private feedback for ${business.name}${rating ? ` (${rating}★)` : ''}`,
      html: `<p>A customer left a private note on your review page.</p><p><b>Rating:</b> ${rating ?? 'none'}</p><p style="white-space:pre-wrap">${escapeHtml(comment)}</p>`,
    });
  } catch (error) {
    console.error('feedback alert email failed', error);
  }
  return NextResponse.json({ ok: true });
}
