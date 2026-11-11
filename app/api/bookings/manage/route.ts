import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { asTrimmedString } from '@/lib/leads/parse';
import { isValidSlug, normalizeSlug } from '@/lib/bookings/slots';
import { UUID_PATTERN } from '@/lib/leads/types';
import { getBusinessById } from '@/lib/bookings/store';

async function requireOwner() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: NextResponse.json({ error: 'Sign in required.' }, { status: 401 }) };
  return { user: data.user };
}

async function ownedBusiness(businessId: string, ownerId: string) {
  if (!UUID_PATTERN.test(businessId)) return null;
  const business = await getBusinessById(businessId);
  if (!business || business.owner_id !== ownerId) return null;
  return business;
}

export async function POST(request: NextRequest) {
  const auth = await requireOwner();
  if ('error' in auth && auth.error) return auth.error;
  const user = 'user' in auth ? auth.user : null;
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = asTrimmedString(body.action);
  const admin = createAdminClient();

  try {
    if (action === 'createBusiness') {
      const name = asTrimmedString(body.name);
      const slug = normalizeSlug(asTrimmedString(body.slug) || name);
      const email = asTrimmedString(body.email) || user.email || '';
      const timezone = asTrimmedString(body.timezone) || 'America/Chicago';
      if (!name || !isValidSlug(slug)) {
        return NextResponse.json({ error: 'A name and a simple URL slug are required.' }, { status: 400 });
      }
      const { data, error } = await admin
        .from('booking_businesses')
        .insert({
          owner_id: user.id,
          name,
          slug,
          email: email || null,
          timezone,
          published: true,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (error) {
        if (/duplicate|unique/i.test(error.message)) {
          return NextResponse.json({ error: 'That booking URL is already taken.' }, { status: 409 });
        }
        throw new Error(error.message);
      }
      const defaults = [1, 2, 3, 4, 5].map((weekday) => ({
        business_id: data.id,
        weekday,
        start_time: '09:00',
        end_time: '17:00',
      }));
      await admin.from('booking_weekly_hours').insert(defaults);
      return NextResponse.json({ business: data });
    }

    if (action === 'addService') {
      const business = await ownedBusiness(asTrimmedString(body.businessId), user.id);
      if (!business) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
      const name = asTrimmedString(body.name);
      const duration = Number(body.durationMinutes);
      const priceCents = Math.round(Number(body.price) * 100);
      const depositType = asTrimmedString(body.depositType) || 'amount';
      const depositValue = Number(body.deposit);
      if (!name || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(priceCents)) {
        return NextResponse.json({ error: 'Name, duration, and price are required.' }, { status: 400 });
      }
      const payload =
        depositType === 'percent'
          ? { deposit_percent: depositValue, deposit_cents: null }
          : { deposit_cents: Math.round(depositValue * 100), deposit_percent: null };
      if (depositType === 'percent' && (!(depositValue > 0) || depositValue > 100)) {
        return NextResponse.json({ error: 'Deposit percent must be between 1 and 100.' }, { status: 400 });
      }
      const { data, error } = await admin
        .from('booking_services')
        .insert({
          business_id: business.id,
          name,
          duration_minutes: Math.round(duration),
          price_cents: priceCents,
          ...payload,
          active: true,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ service: data });
    }

    if (action === 'saveHours') {
      const business = await ownedBusiness(asTrimmedString(body.businessId), user.id);
      if (!business) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
      const hours = Array.isArray(body.hours) ? body.hours : [];
      const rows: Array<{ business_id: string; weekday: number; start_time: string; end_time: string }> = [];
      for (const row of hours) {
        const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
        const weekday = Number(item.weekday);
        const startTime = asTrimmedString(item.startTime);
        const endTime = asTrimmedString(item.endTime);
        if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !startTime || !endTime) continue;
        if (endTime <= startTime) continue;
        rows.push({ business_id: business.id, weekday, start_time: startTime, end_time: endTime });
      }
      await admin.from('booking_weekly_hours').delete().eq('business_id', business.id);
      if (rows.length) {
        const { error } = await admin.from('booking_weekly_hours').insert(rows);
        if (error) throw new Error(error.message);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'addBlackout') {
      const business = await ownedBusiness(asTrimmedString(body.businessId), user.id);
      if (!business) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
      const startDate = asTrimmedString(body.startDate);
      const endDate = asTrimmedString(body.endDate) || startDate;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) {
        return NextResponse.json({ error: 'A valid blackout date range is required.' }, { status: 400 });
      }
      const { data, error } = await admin
        .from('booking_blackouts')
        .insert({
          business_id: business.id,
          start_date: startDate,
          end_date: endDate,
          note: asTrimmedString(body.note) || null,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ blackout: data });
    }

    if (action === 'deleteBlackout') {
      const id = asTrimmedString(body.id);
      if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
      const { data: row } = await admin.from('booking_blackouts').select('id, business_id').eq('id', id).maybeSingle();
      if (!row || !(await ownedBusiness(String(row.business_id), user.id))) {
        return NextResponse.json({ error: 'Not found.' }, { status: 404 });
      }
      await admin.from('booking_blackouts').delete().eq('id', id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error('Unable to update booking settings', error);
    return NextResponse.json({ error: 'Settings could not be saved right now.' }, { status: 503 });
  }
}
