import { NextRequest, NextResponse } from 'next/server';
import { PUBLIC_TOKEN_PATTERN } from '@/lib/campaigns';
import { suppressionAddressKey } from '@/lib/suppression';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { token } = await context.params;
  if (!PUBLIC_TOKEN_PATTERN.test(token)) {
    return NextResponse.json({ error: 'Invalid campaign link.' }, { status: 404 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    doNotPhotograph?: boolean;
    doNotMail?: boolean;
  };
  const doNotPhotograph = body.doNotPhotograph !== false;
  const doNotMail = body.doNotMail !== false;
  if (!doNotPhotograph && !doNotMail) {
    return NextResponse.json({ error: 'Choose at least one opt-out.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: recipient } = await admin
    .from('campaign_recipients')
    .select(`
      id, campaign_id, address_line_1, address_line_2, city, state, postal_code,
      campaigns!inner(owner_id, status)
    `)
    .eq('public_token', token)
    .eq('campaigns.status', 'active')
    .single();
  if (!recipient) return NextResponse.json({ error: 'Campaign link not found.' }, { status: 404 });
  const campaign = Array.isArray(recipient.campaigns)
    ? recipient.campaigns[0]
    : recipient.campaigns;
  if (!campaign?.owner_id) {
    return NextResponse.json({ error: 'Campaign owner not found.' }, { status: 404 });
  }
  const addressKey = suppressionAddressKey(recipient);
  const { error } = await admin.from('campaign_opt_outs').upsert(
    {
      owner_id: campaign.owner_id,
      campaign_id: recipient.campaign_id,
      recipient_id: recipient.id,
      address_key: addressKey,
      do_not_photograph: doNotPhotograph,
      do_not_mail: doNotMail,
      source: 'homeowner',
    },
    { onConflict: 'owner_id,address_key' },
  );
  if (error) {
    console.error('opt-out save error', error);
    return NextResponse.json({ error: 'Could not save the opt-out.' }, { status: 500 });
  }
  // Keep the recipient row current even if trigger deployment differs.
  await admin
    .from('campaign_recipients')
    .update({
      do_not_photograph: doNotPhotograph,
      do_not_mail: doNotMail,
    })
    .eq('id', recipient.id);
  return NextResponse.json({
    ok: true,
    message: 'This address has been added to the YardProof suppression list.',
  });
}
