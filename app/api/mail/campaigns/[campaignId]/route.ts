import { NextRequest, NextResponse } from 'next/server';
import { isUuid, OwnerContext, requireCampaignOwner } from '@/lib/imagery/auth';
import { calculateCampaignCost, getMailConfig } from '@/lib/mail/config';
import { createPostcard, isDeliverable, verifyUsAddress } from '@/lib/mail/lob';
import {
  postcardEligibility,
  PostcardCampaign,
  PostcardRecipient,
  renderPostcardHtml,
} from '@/lib/mail/postcard';
import { suppressionAddressKey } from '@/lib/suppression';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ campaignId: string }> };

type CampaignRow = PostcardCampaign & {
  id: string;
  status: string;
  campaign_recipients: PostcardRecipient[];
};

async function loadCampaign(
  admin: OwnerContext['admin'],
  campaignId: string,
  userId: string,
) {
  const result = await admin
    .from('campaigns')
    .select(`
      id, name, business_name, business_phone, business_email, status,
      campaign_recipients (
        id, public_token, homeowner_name, address_line_1, address_line_2, city, state,
        postal_code, current_image_url, current_image_source, after_image_url, review_status,
        mail_vendor_job_id, rights_basis, privacy_redaction_status, do_not_mail
      )
    `)
    .eq('id', campaignId)
    .eq('owner_id', userId)
    .single();
  if (!result.data || result.error) return result;

  const { data: suppressions } = await admin
    .from('campaign_opt_outs')
    .select('address_key')
    .eq('owner_id', userId)
    .eq('do_not_mail', true);
  const suppressedKeys = new Set((suppressions ?? []).map((row) => row.address_key));
  const campaign = result.data as unknown as CampaignRow;
  campaign.campaign_recipients = campaign.campaign_recipients.map((recipient) => ({
    ...recipient,
    do_not_mail:
      recipient.do_not_mail || suppressedKeys.has(suppressionAddressKey(recipient)),
  }));
  return { ...result, data: campaign };
}

function preview(campaign: CampaignRow) {
  const config = getMailConfig();
  const recipients = campaign.campaign_recipients.map((recipient) => ({
    id: recipient.id,
    address: `${recipient.address_line_1}, ${recipient.city}, ${recipient.state} ${recipient.postal_code}`,
    ...postcardEligibility(recipient),
  }));
  const eligibleCount = recipients.filter((recipient) => recipient.eligible).length;
  return {
    campaignId: campaign.id,
    campaignStatus: campaign.status,
    mode: config.mode,
    liveEnabled: config.liveEnabled,
    postcardSize: config.postcardSize,
    pricePerCardCents: config.pricePerCardCents,
    eligibleCount,
    totalRecipients: recipients.length,
    estimatedTotalCents: calculateCampaignCost(eligibleCount, config.pricePerCardCents),
    configured: Boolean(
      process.env.LOB_API_KEY?.trim() &&
        config.returnAddress &&
        config.pricePerCardCents != null,
    ),
    recipients,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;
  const { campaignId } = await context.params;
  if (!isUuid(campaignId)) {
    return NextResponse.json({ error: 'A valid campaignId is required.' }, { status: 400 });
  }
  const { data, error } = await loadCampaign(auth.ctx.admin, campaignId, auth.ctx.userId);
  if (error || !data) {
    return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
  }
  return NextResponse.json(preview(data as unknown as CampaignRow));
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;
  const { campaignId } = await context.params;
  if (!isUuid(campaignId)) {
    return NextResponse.json({ error: 'A valid campaignId is required.' }, { status: 400 });
  }
  const body = (await request.json().catch(() => ({}))) as { approvalConfirmed?: boolean };
  if (body.approvalConfirmed !== true) {
    return NextResponse.json(
      { error: 'Approve & send requires explicit approvalConfirmed=true.' },
      { status: 400 },
    );
  }

  const { data, error } = await loadCampaign(auth.ctx.admin, campaignId, auth.ctx.userId);
  if (error || !data) {
    return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
  }
  const campaign = data as unknown as CampaignRow;
  const campaignPreview = preview(campaign);
  const config = getMailConfig();
  if (campaign.status !== 'active') {
    return NextResponse.json(
      { error: 'Activate the campaign before mailing so every QR estimate page is available.' },
      { status: 409 },
    );
  }
  if (!campaignPreview.configured || !config.returnAddress) {
    return NextResponse.json(
      { error: 'Lob, return-address, and per-card cost environment variables are required.' },
      { status: 503 },
    );
  }
  if (campaignPreview.eligibleCount === 0 || campaignPreview.estimatedTotalCents == null) {
    return NextResponse.json({ error: 'No approved, mail-eligible recipients.' }, { status: 409 });
  }

  const approvedAt = new Date().toISOString();
  await auth.ctx.admin
    .from('campaigns')
    .update({
      mail_approved_at: approvedAt,
      mail_approved_by: auth.ctx.userId,
      mail_mode: config.mode,
      mail_price_per_card_cents: config.pricePerCardCents,
      mail_estimated_total_cents: campaignPreview.estimatedTotalCents,
      mail_status: 'sending',
    })
    .eq('id', campaign.id);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '');
  const results: Array<{ recipientId: string; ok: boolean; jobId?: string; error?: string }> = [];
  for (const recipient of campaign.campaign_recipients) {
    const eligibility = postcardEligibility(recipient);
    if (!eligibility.eligible) continue;
    const to = {
      name: recipient.homeowner_name || 'Current Resident',
      address_line1: recipient.address_line_1,
      address_line2: recipient.address_line_2,
      address_city: recipient.city,
      address_state: recipient.state,
      address_zip: recipient.postal_code,
      address_country: 'US' as const,
    };

    try {
      // Re-check suppression and idempotency immediately before the vendor call.
      const { data: sendGuard } = await auth.ctx.admin
        .from('campaign_recipients')
        .select('do_not_mail, mail_vendor_job_id')
        .eq('id', recipient.id)
        .single();
      const { data: suppressionGuard } = await auth.ctx.admin
        .from('campaign_opt_outs')
        .select('id')
        .eq('owner_id', auth.ctx.userId)
        .eq('address_key', suppressionAddressKey(recipient))
        .eq('do_not_mail', true)
        .maybeSingle();
      if (!sendGuard || sendGuard.do_not_mail || suppressionGuard) {
        throw new Error('Address is on the do-not-mail list.');
      }
      if (sendGuard.mail_vendor_job_id) {
        throw new Error('A vendor job already exists for this recipient.');
      }
      const { data: reservation } = await auth.ctx.admin
        .from('campaign_recipients')
        .update({ mail_status: 'creating', mail_error: null })
        .eq('id', recipient.id)
        .is('mail_vendor_job_id', null)
        .in('mail_status', ['not_sent', 'failed'])
        .select('id')
        .maybeSingle();
      if (!reservation) {
        throw new Error('Mail creation is already reserved or completed for this recipient.');
      }

      const verification = await verifyUsAddress(config.mode, to);
      const verificationStatus = isDeliverable(verification)
        ? verification.deliverability
        : 'undeliverable';
      await auth.ctx.admin
        .from('campaign_recipients')
        .update({
          address_verification_status: verificationStatus,
          address_verified_at: new Date().toISOString(),
          address_verification_details: verification,
        })
        .eq('id', recipient.id);
      if (!isDeliverable(verification)) {
        throw new Error(`Address verification returned ${verification.deliverability}.`);
      }

      const creative = await renderPostcardHtml({
        recipient,
        campaign,
        estimateUrl: `${appUrl}/q/${recipient.public_token}`,
        size: config.postcardSize,
      });
      const postcard = await createPostcard({
        mode: config.mode,
        description: `${campaign.name} — ${recipient.address_line_1}`,
        to,
        from: config.returnAddress,
        front: creative.front,
        back: creative.back,
        size: config.postcardSize,
        recipientId: recipient.id,
      });
      await auth.ctx.admin
        .from('campaign_recipients')
        .update({
          mail_vendor: 'lob',
          mail_vendor_job_id: postcard.id,
          mail_status: config.mode === 'test' ? 'test_created' : 'created',
          mail_mode: config.mode,
          mail_sent_at: new Date().toISOString(),
          mail_error: null,
        })
        .eq('id', recipient.id);
      results.push({ recipientId: recipient.id, ok: true, jobId: postcard.id });
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Mail creation failed.';
      await auth.ctx.admin
        .from('campaign_recipients')
        .update({ mail_status: 'failed', mail_error: message })
        .eq('id', recipient.id);
      results.push({ recipientId: recipient.id, ok: false, error: message });
    }
  }

  const sentCount = results.filter((result) => result.ok).length;
  const finalStatus =
    sentCount === results.length ? 'sent' : sentCount > 0 ? 'partial' : 'failed';
  await auth.ctx.admin
    .from('campaigns')
    .update({ mail_status: finalStatus })
    .eq('id', campaign.id);

  return NextResponse.json(
    {
      ok: sentCount === results.length,
      mode: config.mode,
      approvedAt,
      sentCount,
      failedCount: results.length - sentCount,
      estimatedTotalCents: campaignPreview.estimatedTotalCents,
      results,
    },
    { status: sentCount > 0 ? 200 : 502 },
  );
}
