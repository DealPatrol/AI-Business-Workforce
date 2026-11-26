import { NextRequest, NextResponse } from 'next/server';
import { isUuid, parseJsonBody, requireCampaignOwner } from '@/lib/imagery/auth';
import { getOwnedLead } from '@/lib/aerial-leads/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** POST { decision: 'approve' | 'reject' | 'reset' } — the manual gate before any (test) mail. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
  const row = await getOwnedLead(auth.ctx.admin, auth.ctx.userId, id);
  if (!row) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
  if (row.status === 'test_mailed') return NextResponse.json({ error: 'This card was already sent as a test.' }, { status: 409 });

  const body = await parseJsonBody(request);
  const decision = String(body.decision ?? '');
  const update =
    decision === 'approve'
      ? { status: 'approved', approved_at: new Date().toISOString(), approved_by: auth.ctx.userId }
      : decision === 'reject'
        ? { status: 'rejected', approved_at: null, approved_by: null }
        : decision === 'reset'
          ? { status: 'flagged', approved_at: null, approved_by: null }
          : null;
  if (!update) return NextResponse.json({ error: 'decision must be approve, reject, or reset.' }, { status: 400 });

  const { error } = await auth.ctx.admin.from('aerial_leads').update(update).eq('id', id).eq('owner_id', auth.ctx.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, status: update.status });
}
