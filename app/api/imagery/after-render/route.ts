import { NextRequest, NextResponse } from 'next/server';
import {
  assertRecipientOwned,
  imageryBucket,
  parseJsonBody,
  requireCampaignOwner,
} from '@/lib/imagery/auth';
import {
  isAfterRenderConfigured,
  renderAfter,
} from '@/lib/imagery/after-render';
import { fetchAllowedImage } from '@/lib/imagery/safe-fetch';
import { getCampaignTrade } from '@/lib/campaign-trade';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** Current sources accepted as AI After input (and printable Current). */
const ACCEPTED_CURRENT = new Set(['street_view', 'crew_photo', 'owner_upload']);

/**
 * Trigger After render from Current (Street View preferred product path;
 * crew_photo / owner_upload remain valid alternates).
 */
export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;

  if (!isAfterRenderConfigured()) {
    return NextResponse.json(
      {
        error:
          'After-render provider is not configured. Set OPENAI_API_KEY (IMAGERY_PROVIDER=openai) or GEMINI_API_KEY when Gemini is wired.',
        configured: false,
      },
      { status: 503 },
    );
  }

  try {
    const body = await parseJsonBody(request);
    const recipientId = String(body.recipientId ?? '').trim();
    const owned = await assertRecipientOwned(auth.ctx, recipientId);
    if (!owned.ok) return owned.response;

    const recipient = owned.recipient;
    if (!recipient.current_image_url) {
      return NextResponse.json(
        {
          error:
            'Fetch Street View Current (POST /api/imagery/streetview-preview) or upload crew_photo/owner_upload before rendering After.',
        },
        { status: 400 },
      );
    }
    if (!recipient.current_image_source || !ACCEPTED_CURRENT.has(recipient.current_image_source)) {
      return NextResponse.json(
        {
          error:
            'Current must be street_view, crew_photo, or owner_upload before rendering After.',
        },
        { status: 400 },
      );
    }

    await auth.ctx.admin
      .from('campaign_recipients')
      .update({ imagery_status: 'rendering_after', imagery_error: null })
      .eq('id', recipient.id);

    // SSRF guard: only our Supabase Storage host or Google Street View Static.
    const { bytes: currentBytes, mimeType: currentMimeType } = await fetchAllowedImage(
      recipient.current_image_url,
    ).catch((error: unknown) => {
      throw new Error(
        `Could not download Current image: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    });

    const catalogSkus = Array.isArray(body.catalogSkus)
      ? body.catalogSkus.map(String)
      : undefined;
    const trade = await getCampaignTrade(auth.ctx.admin, recipient.campaign_id);

    const rendered = await renderAfter({
      currentBytes,
      currentMimeType,
      trade,
      catalogSkus,
      budgetMax:
        body.budgetMax != null && Number.isFinite(Number(body.budgetMax))
          ? Number(body.budgetMax)
          : undefined,
      promptVersion: body.promptVersion ? String(body.promptVersion) : undefined,
    });

    const bucket = imageryBucket();
    const ext = rendered.mimeType === 'image/jpeg' ? 'jpg' : rendered.mimeType === 'image/webp' ? 'webp' : 'png';
    const path = `${recipient.id}/after-${Date.now()}.${ext}`;
    const { error: uploadError } = await auth.ctx.admin.storage
      .from(bucket)
      .upload(path, rendered.imageBytes, {
        contentType: rendered.mimeType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(
        `Storage upload failed (${uploadError.message}). Ensure bucket "${bucket}" exists.`,
      );
    }

    const { data: signed, error: signError } = await auth.ctx.admin.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    if (signError || !signed?.signedUrl) {
      throw new Error('After upload succeeded but signed URL creation failed.');
    }

    const conceptJson = {
      ...(recipient.concept_json ?? {}),
      trade: rendered.conceptPlan.trade,
      selectedCatalogItems: rendered.conceptPlan.selectedCatalogItems,
      scopeBullets: rendered.conceptPlan.scopeBullets,
      conceptNotes: rendered.conceptPlan.notes,
      catalogDisclosure: rendered.conceptPlan.catalogDisclosure,
      after: {
        provider: rendered.provider,
        model: rendered.model,
        promptVersion: rendered.promptVersion,
        storagePath: path,
        currentSource: recipient.current_image_source,
        renderedAt: new Date().toISOString(),
      },
    };

    const { error: updateError } = await auth.ctx.admin
      .from('campaign_recipients')
      .update({
        after_image_url: signed.signedUrl,
        after_image_provider: `${rendered.provider}:${rendered.model}`,
        after_prompt_version: rendered.promptVersion,
        concept_json: conceptJson,
        review_status: 'pending_review',
        postcard_approved_at: null,
        imagery_status: 'ready',
        imagery_error: null,
        // Keep legacy concept_image_url pointing at After for older UI paths
        concept_image_url: signed.signedUrl,
        concept_summary:
          `Illustrative ${rendered.conceptPlan.trade.replaceAll('_', ' ')} concept based on the reviewed scope and curated references. Subject to contractor review.`,
      })
      .eq('id', recipient.id);

    if (updateError) {
      throw new Error('After render stored but recipient update failed.');
    }

    return NextResponse.json({
      ok: true,
      afterImageUrl: signed.signedUrl,
      provider: rendered.provider,
      model: rendered.model,
      promptVersion: rendered.promptVersion,
      conceptPlan: rendered.conceptPlan,
      currentImageSource: recipient.current_image_source,
      reviewStatus: 'pending_review',
      note: 'Human review required before mailing. Call POST /api/imagery/review to approve.',
    });
  } catch (error) {
    console.error('after-render error', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'After render failed.',
      },
      { status: 502 },
    );
  }
}
