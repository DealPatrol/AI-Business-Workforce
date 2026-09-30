import { NextRequest, NextResponse } from 'next/server';
import {
  assertRecipientOwned,
  parseJsonBody,
  requireCampaignOwner,
} from '@/lib/imagery/auth';
import {
  getConceptProfile,
  selectCatalogChoices,
} from '@/lib/concept-profiles';
import { getCampaignTrade } from '@/lib/campaign-trade';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED = new Set(['approved', 'changes_requested', 'rejected', 'pending_review']);
const ACCEPTED_CURRENT = new Set(['street_view', 'crew_photo', 'owner_upload']);
const MISSING_COLUMN_CODES = new Set(['42703', 'PGRST204']);

/**
 * Set human review_status. Approval requires Current (SV or crew/owner) + After URLs.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;

  try {
    const body = await parseJsonBody(request);
    const recipientId = String(body.recipientId ?? '').trim();
    const status = String(body.status ?? '').trim();
    const notes = body.notes != null ? String(body.notes).slice(0, 2000) : null;
    const requestedSelections = Array.isArray(body.catalogSelections)
      ? body.catalogSelections.map(String).slice(0, 12)
      : null;

    if (!ALLOWED.has(status)) {
      return NextResponse.json(
        {
          error:
            'status must be approved | changes_requested | rejected | pending_review',
        },
        { status: 400 },
      );
    }

    const owned = await assertRecipientOwned(auth.ctx, recipientId);
    if (!owned.ok) return owned.response;

    const recipient = owned.recipient;
    const trade = await getCampaignTrade(auth.ctx.admin, recipient.campaign_id);
    if (status === 'approved') {
      if (!recipient.current_image_url || !recipient.after_image_url) {
        return NextResponse.json(
          {
            error:
              'Cannot approve without Current (street_view / crew_photo / owner_upload) and After imagery.',
          },
          { status: 400 },
        );
      }
      if (
        !recipient.current_image_source ||
        !ACCEPTED_CURRENT.has(recipient.current_image_source)
      ) {
        return NextResponse.json(
          {
            error:
              'Cannot approve: Current must be street_view, crew_photo, or owner_upload.',
          },
          { status: 400 },
        );
      }
    }

    const patch: Record<string, unknown> = {
      review_status: status,
      review_notes: notes,
      postcard_approved_at:
        status === 'approved' ? new Date().toISOString() : null,
    };

    if (status === 'changes_requested') patch.change_notes = notes;

    if (requestedSelections) {
      const profile = getConceptProfile(trade);
      patch.concept_json = {
        ...(recipient.concept_json ?? {}),
        trade,
        selectedCatalogItems: selectCatalogChoices(profile, requestedSelections),
        scopeBullets: profile.scopeTemplates,
        catalogDisclosure: profile.catalogDisclosure,
      };
    }

    let { error } = await auth.ctx.admin
      .from('campaign_recipients')
      .update(patch)
      .eq('id', recipient.id);

    // Deploy-order safety: the UI and existing review workflow remain usable
    // before the Demo 10 migration adds change_notes.
    if (error && MISSING_COLUMN_CODES.has(error.code)) {
      delete patch.change_notes;
      const fallback = await auth.ctx.admin
        .from('campaign_recipients')
        .update(patch)
        .eq('id', recipient.id);
      error = fallback.error;
    }

    if (error) {
      console.error('imagery review update failed', error);
      return NextResponse.json({ error: 'Could not update review status.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      recipientId: recipient.id,
      reviewStatus: status,
      postcardApprovedAt: patch.postcard_approved_at,
    });
  } catch (error) {
    console.error('imagery review error', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Review update failed.',
      },
      { status: 500 },
    );
  }
}
