import { NextRequest, NextResponse } from 'next/server';
import {
  assertRecipientOwned,
  parseJsonBody,
  requireCampaignOwner,
} from '@/lib/imagery/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED = new Set(['approved', 'changes_requested', 'rejected', 'pending_review']);

/**
 * Set human review_status. Approval requires printable Current + After URLs.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;

  try {
    const body = await parseJsonBody(request);
    const recipientId = String(body.recipientId ?? '').trim();
    const status = String(body.status ?? '').trim();
    const notes = body.notes != null ? String(body.notes).slice(0, 2000) : null;

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
    if (status === 'approved') {
      if (!recipient.current_image_url || !recipient.after_image_url) {
        return NextResponse.json(
          {
            error:
              'Cannot approve without printable Current (crew/owner) and After imagery.',
          },
          { status: 400 },
        );
      }
      if (
        recipient.current_image_source !== 'crew_photo' &&
        recipient.current_image_source !== 'owner_upload'
      ) {
        return NextResponse.json(
          {
            error:
              'Cannot approve: Current must be crew_photo or owner_upload (not Street View).',
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

    const { error } = await auth.ctx.admin
      .from('campaign_recipients')
      .update(patch)
      .eq('id', recipient.id);

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
