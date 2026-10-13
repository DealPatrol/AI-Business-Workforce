import { NextRequest, NextResponse } from 'next/server';
import { parseJsonBody, requireCampaignOwner } from '@/lib/imagery/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_CARDS = 500;

/** Save a campaign from the builder and create one card (recipient) per matched home. */
export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(request);
  const businessName = String(body.businessName ?? '').trim().slice(0, 120);
  const name = String(body.name ?? '').trim().slice(0, 120) || 'Neighbor campaign';
  const size = body.size === '6x9' ? '6x9' : '4x6';
  const source = body.source === 'regrid' ? 'regrid' : 'sample';
  const parcels = Array.isArray(body.parcels) ? (body.parcels as Array<Record<string, unknown>>) : [];
  if (!businessName) return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
  if (parcels.length === 0) return NextResponse.json({ error: 'No homes selected.' }, { status: 400 });
  if (parcels.length > MAX_CARDS) return NextResponse.json({ error: `At most ${MAX_CARDS} homes per campaign.` }, { status: 400 });

  const { data: campaign, error } = await auth.ctx.admin
    .from('campaigns')
    .insert({
      owner_id: auth.ctx.userId,
      name: source === 'sample' ? `${name} (SAMPLE homes)` : name,
      business_name: businessName,
      business_phone: body.businessPhone ? String(body.businessPhone).slice(0, 40) : null,
      status: 'draft',
      targeting_json: body.filters ?? null,
      postcard_size: size,
      source: `campaign_builder_${source}`,
    })
    .select('id')
    .single();
  if (error || !campaign) {
    console.error('campaign insert failed', error);
    return NextResponse.json({ error: error?.message ?? 'Could not save campaign.' }, { status: 500 });
  }

  const rows = parcels
    .filter((p) => p.address && p.zip)
    .map((p) => ({
      campaign_id: campaign.id,
      address_line_1: String(p.address).slice(0, 200),
      city: String(p.city || '').slice(0, 100) || 'Unknown',
      state: String(p.state || '').slice(0, 2) || 'AL',
      postal_code: String(p.zip).slice(0, 10),
      latitude: p.lat ?? null,
      longitude: p.lng ?? null,
      parcel_id: p.id ? String(p.id) : null,
      parcel_json: p,
      review_status: 'pending',
    }));
  const { error: recErr } = await auth.ctx.admin.from('campaign_recipients').insert(rows);
  if (recErr) {
    console.error('recipient insert failed', recErr);
    await auth.ctx.admin.from('campaigns').delete().eq('id', campaign.id);
    return NextResponse.json({ error: recErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, campaignId: campaign.id, cards: rows.length });
}
