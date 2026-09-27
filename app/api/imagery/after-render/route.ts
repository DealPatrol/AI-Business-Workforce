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
import { redactPrivateDetails } from '@/lib/imagery/privacy-redaction';
import { fetchAllowedImage } from '@/lib/imagery/safe-fetch';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** Rights-cleared Current sources accepted as AI and print input. */
const ACCEPTED_CURRENT = new Set(['crew_photo', 'owner_upload', 'licensed']);
const ACCEPTED_RIGHTS = new Set(['crew_owned', 'homeowner_upload', 'licensed']);

/**
 * Trigger After render only from a privacy-redacted, rights-cleared Current.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;
  let renderingRecipientId: string | null = null;

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
    renderingRecipientId = recipient.id;
    if (!recipient.current_image_url) {
      return NextResponse.json(
        {
          error:
            'Capture or upload a rights-cleared photo before rendering an After.',
        },
        { status: 400 },
      );
    }
    const currentSource = recipient.current_image_source;
    if (!currentSource || !ACCEPTED_CURRENT.has(currentSource)) {
      return NextResponse.json(
        {
          error:
            'Current must be a crew, homeowner-uploaded, or separately licensed photo.',
        },
        { status: 400 },
      );
    }
    if (!recipient.rights_basis || !ACCEPTED_RIGHTS.has(recipient.rights_basis)) {
      return NextResponse.json(
        { error: 'A documented photo rights basis is required before AI rendering.' },
        { status: 403 },
      );
    }
    if (recipient.privacy_redaction_status !== 'redacted') {
      return NextResponse.json(
        { error: 'Privacy redaction must complete before AI rendering.' },
        { status: 403 },
      );
    }

    await auth.ctx.admin
      .from('campaign_recipients')
      .update({ imagery_status: 'rendering_after', imagery_error: null })
      .eq('id', recipient.id);

    const current = await fetchAllowedImage(recipient.current_image_url).catch(
      (error: unknown) => {
        throw new Error(
          `Could not download Current image: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      },
    );

    const catalogSkus = Array.isArray(body.catalogSkus)
      ? body.catalogSkus.map(String)
      : undefined;

    const rendered = await renderAfter({
      currentBytes: current.bytes,
      currentMimeType: current.mimeType,
      trade: String(body.trade ?? 'landscaping'),
      catalogSkus,
      budgetMax:
        body.budgetMax != null && Number.isFinite(Number(body.budgetMax))
          ? Number(body.budgetMax)
          : undefined,
      promptVersion: body.promptVersion ? String(body.promptVersion) : undefined,
    });

    // AI output receives the same fail-closed privacy pass before storage,
    // review, public display, or print.
    const redactedAfter = await redactPrivateDetails(rendered.imageBytes);
    const bucket = imageryBucket();
    const path = `${recipient.id}/after-redacted-${Date.now()}.png`;
    const { error: uploadError } = await auth.ctx.admin.storage
      .from(bucket)
      .upload(path, redactedAfter.bytes, {
        contentType: redactedAfter.mimeType,
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
        currentSource,
        rightsBasis: recipient.rights_basis,
        privacyRedaction: {
          provider: redactedAfter.provider,
          details: redactedAfter.details,
        },
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
          'Design concept, AI mockup. Actual scope and price require contractor review.',
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
      currentImageSource: currentSource,
      reviewStatus: 'pending_review',
      note: 'Human review required before mailing. Call POST /api/imagery/review to approve.',
    });
  } catch (error) {
    console.error('after-render error', error);
    if (renderingRecipientId) {
      await auth.ctx.admin
        .from('campaign_recipients')
        .update({
          imagery_status: 'failed',
          imagery_error: error instanceof Error ? error.message : 'After render failed.',
        })
        .eq('id', renderingRecipientId);
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'After render failed.',
      },
      { status: 502 },
    );
  }
}
