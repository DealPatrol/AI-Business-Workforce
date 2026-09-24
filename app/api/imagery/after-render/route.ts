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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const PRINTABLE = new Set(['crew_photo', 'owner_upload']);

/**
 * Trigger After render from printable Current only.
 * Refuses Street View / satellite sources.
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
            'Upload a crew_photo or owner_upload Current before rendering After. Street View cannot be used as AI input.',
        },
        { status: 400 },
      );
    }
    if (!recipient.current_image_source || !PRINTABLE.has(recipient.current_image_source)) {
      return NextResponse.json(
        {
          error:
            'Printable Current must be crew_photo or owner_upload. Refusing Street View / unknown sources as AI input.',
        },
        { status: 400 },
      );
    }

    await auth.ctx.admin
      .from('campaign_recipients')
      .update({ imagery_status: 'rendering_after', imagery_error: null })
      .eq('id', recipient.id);

    const currentResponse = await fetch(recipient.current_image_url, {
      cache: 'no-store',
    });
    if (!currentResponse.ok) {
      throw new Error(`Could not download Current image (HTTP ${currentResponse.status}).`);
    }
    const currentBytes = Buffer.from(await currentResponse.arrayBuffer());
    const currentMimeType = currentResponse.headers.get('content-type') || 'image/jpeg';

    const catalogSkus = Array.isArray(body.catalogSkus)
      ? body.catalogSkus.map(String)
      : undefined;

    const rendered = await renderAfter({
      currentBytes,
      currentMimeType,
      trade: String(body.trade ?? 'landscaping'),
      catalogSkus,
      budgetMax:
        body.budgetMax != null && Number.isFinite(Number(body.budgetMax))
          ? Number(body.budgetMax)
          : undefined,
      promptVersion: body.promptVersion ? String(body.promptVersion) : undefined,
    });

    const bucket = imageryBucket();
    const path = `${recipient.id}/after-${Date.now()}.png`;
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
      plantPlan: rendered.plantPlan,
      after: {
        provider: rendered.provider,
        model: rendered.model,
        promptVersion: rendered.promptVersion,
        storagePath: path,
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
          'Illustrative concept after a light plant & trim refresh (approx. $1–3k plant materials). Subject to contractor review.',
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
      plantPlan: rendered.plantPlan,
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
