import { NextRequest, NextResponse } from 'next/server';
import { isUuid, parseJsonBody, requireCampaignOwner } from '@/lib/imagery/auth';
import { createTestPostcard, lobTestKey } from '@/lib/mail/lob';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const esc = (s: unknown) => String(s ?? '').replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Send every approved card (with BEFORE + AFTER photos) through Lob TEST mode.
 * Test mode never prints or mails. Live keys are rejected by lobTestKey().
 */
export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;
  try {
    if (!lobTestKey()) {
      return NextResponse.json({ error: 'Lob test mailing is not connected yet (LOB_API_KEY test key missing).', configured: false }, { status: 503 });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }

  const body = await parseJsonBody(request);
  const campaignId = String(body.campaignId ?? '');
  if (!isUuid(campaignId)) return NextResponse.json({ error: 'A valid campaignId is required.' }, { status: 400 });
  const from = body.from as Record<string, string> | undefined;
  if (!from?.address_line1 || !from?.address_city || !from?.address_state || !from?.address_zip) {
    return NextResponse.json({ error: 'Return address (street, city, state, ZIP) is required.' }, { status: 400 });
  }

  const { data: campaign } = await auth.ctx.admin
    .from('campaigns')
    .select('id, business_name, business_phone, postcard_size')
    .eq('id', campaignId)
    .eq('owner_id', auth.ctx.userId)
    .single();
  if (!campaign) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });

  const { data: recipients } = await auth.ctx.admin
    .from('campaign_recipients')
    .select('id, public_token, address_line_1, city, state, postal_code, current_image_url, after_image_url, review_status, lob_postcard_id')
    .eq('campaign_id', campaignId)
    .eq('review_status', 'approved')
    .is('lob_postcard_id', null)
    .limit(25);

  const ready = (recipients ?? []).filter((r) => r.current_image_url && r.after_image_url);
  if (ready.length === 0) {
    return NextResponse.json({ error: 'No approved cards with both BEFORE and AFTER photos are waiting to send.' }, { status: 400 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin;
  const size = campaign.postcard_size === '6x9' ? '6x9' : '4x6';
  const results: Array<{ id: string; ok: boolean; lobId?: string; error?: string }> = [];
  for (const r of ready) {
    try {
      const qrTarget = `${origin}/q/${r.public_token}`;
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrTarget)}`;
      const sent = await createTestPostcard({
        size,
        description: `YardProof ${campaignId} ${r.id}`,
        to: { name: 'Current Resident', address_line1: r.address_line_1, address_city: r.city, address_state: r.state, address_zip: r.postal_code },
        from: { name: campaign.business_name, address_line1: from.address_line1, address_city: from.address_city, address_state: from.address_state, address_zip: from.address_zip },
        frontHtml: `<html><body style="margin:0;display:flex;height:100%"><div style="width:50%;position:relative"><img src="${esc(r.current_image_url)}" style="width:100%;height:100%;object-fit:cover"><b style="position:absolute;top:8px;left:8px;background:#fff;padding:2px 6px">BEFORE</b></div><div style="width:50%;position:relative"><img src="${esc(r.after_image_url)}" style="width:100%;height:100%;object-fit:cover"><b style="position:absolute;top:8px;left:8px;background:#fff;padding:2px 6px">AFTER</b></div></body></html>`,
        backHtml: `<html><body style="font-family:sans-serif;padding:0.25in;width:55%"><h2 style="margin:0 0 8px">We just finished a job near you.</h2><p>${esc(campaign.business_name)}${campaign.business_phone ? ` · ${esc(campaign.business_phone)}` : ''}</p><p>Scan for a free estimate.</p><img src="${qr}" style="width:1.1in;height:1.1in"></body></html>`,
      });
      await auth.ctx.admin
        .from('campaign_recipients')
        .update({ lob_postcard_id: sent.id, lob_mode: 'test', lob_sent_at: new Date().toISOString(), lob_error: null })
        .eq('id', r.id);
      results.push({ id: r.id, ok: true, lobId: sent.id });
    } catch (e) {
      const msg = (e as Error).message;
      await auth.ctx.admin.from('campaign_recipients').update({ lob_error: msg.slice(0, 500) }).eq('id', r.id);
      results.push({ id: r.id, ok: false, error: msg });
    }
  }
  return NextResponse.json({ ok: true, mode: 'test', sent: results.filter((x) => x.ok).length, failed: results.filter((x) => !x.ok).length, results });
}
