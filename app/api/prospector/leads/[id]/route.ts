import { NextResponse } from 'next/server';
import { errorResponse, jsonError, requireUser } from '@/lib/prospector/http';
import { isUuid } from '@/lib/prospector/input';
import { getLead, listDrafts, listSends } from '@/lib/prospector/store';
import { DRAFT_KINDS } from '@/lib/prospector/types';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const { id } = await params;
    if (!isUuid(id)) return jsonError('Lead not found.', 404);
    const lead = await getLead(auth.supabase, auth.user.id, id);
    if (!lead) return jsonError('Lead not found.', 404);
    const [drafts, sends] = await Promise.all([
      listDrafts(auth.supabase, auth.user.id, lead.id),
      listSends(auth.supabase, auth.user.id, lead.id),
    ]);
    drafts.sort((left, right) => DRAFT_KINDS.indexOf(left.kind) - DRAFT_KINDS.indexOf(right.kind));
    return NextResponse.json({ lead, drafts, sends });
  } catch (error) {
    return errorResponse(error);
  }
}
