import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { currentUserEmail } from '@/lib/ava/client-access';
import { safeHttpsUrl } from '@/lib/ava/client-settings';
import { ownedBusiness, slugify } from '@/lib/reputation/store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const email = await currentUserEmail();
  if (!email) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = String(body.name || '').trim().slice(0, 120);
  if (!name) return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
  const fields = {
    name,
    google_review_url: safeHttpsUrl(body.googleReviewUrl),
    facebook_url: safeHttpsUrl(body.facebookUrl),
    yelp_url: safeHttpsUrl(body.yelpUrl),
    reply_tone: String(body.replyTone || 'friendly').slice(0, 40),
  };
  const admin = createAdminClient();
  if (body.id) {
    const owned = await ownedBusiness(email, String(body.id));
    if (!owned) return NextResponse.json({ error: 'Not your business.' }, { status: 403 });
    const { error } = await admin.from('rf_businesses').update(fields).eq('id', owned.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: owned.id, slug: owned.slug });
  }
  const base = slugify(name);
  for (let i = 0; i < 5; i += 1) {
    const slug = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await admin
      .from('rf_businesses')
      .insert({ ...fields, slug, owner_email: email })
      .select('id, slug')
      .single();
    if (!error && data) return NextResponse.json(data);
    if (error && !/duplicate|unique/i.test(error.message)) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: 'Could not reserve a link name.' }, { status: 500 });
}
