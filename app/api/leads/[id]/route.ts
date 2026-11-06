import { NextRequest, NextResponse } from 'next/server';
import { ownerCanAccessLead } from '@/lib/leads/access';
import { applyLeadPatch } from '@/lib/leads/apply-booked';
import { parseLeadPatch } from '@/lib/leads/parse';
import { clientIdsForOwnerEmail, getLead } from '@/lib/leads/store';
import { UUID_PATTERN } from '@/lib/leads/types';
import { createClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const lead = await getLead(id);
    const clientIds = await clientIdsForOwnerEmail(user.email ?? '');
    if (!lead || !ownerCanAccessLead(lead, user.id, clientIds)) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = parseLeadPatch(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await applyLeadPatch(lead, { status: parsed.status, notes: parsed.notes });
    return NextResponse.json({ lead: result.lead, billing: result.billing });
  } catch (error) {
    console.error('Unable to update Executive Receptionist lead', error);
    return NextResponse.json({ error: 'The lead could not be updated right now.' }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
