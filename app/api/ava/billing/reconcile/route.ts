import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const STRIPE_API = 'https://api.stripe.com/v1';
const ELEVEN_API = 'https://api.elevenlabs.io/v1';

function authOk(req: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.AVA_BILLING_CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

async function stripeGet(path: string, secret: string) {
  const r = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${secret}`, 'Stripe-Version': '2026-07-29.dahlia' },
    cache: 'no-store',
  });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}

async function stripePost(path: string, secret: string, params: URLSearchParams) {
  const r = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Stripe-Version': '2026-07-29.dahlia',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}

async function stripeDelete(path: string, secret: string) {
  const r = await fetch(`${STRIPE_API}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${secret}`, 'Stripe-Version': '2026-07-29.dahlia' },
  });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}

async function elevenUsage(agentId: string, start: number, end: number, apiKey: string) {
  let cursor = '';
  let seconds = 0;
  let calls = 0;
  do {
    const q = new URLSearchParams({ agent_id: agentId, call_start_after_unix: String(start), call_start_before_unix: String(end), page_size: '100' });
    if (cursor) q.set('cursor', cursor);
    const r = await fetch(`${ELEVEN_API}/convai/conversations?${q.toString()}`, {
      headers: { 'xi-api-key': apiKey },
      cache: 'no-store',
    });
    const data = await r.json();
    if (!r.ok) throw new Error(`ElevenLabs usage lookup failed: ${r.status}`);
    for (const c of data.conversations || []) {
      if (c.status === 'done' || c.call_duration_secs) {
        seconds += Number(c.call_duration_secs || 0);
        calls += 1;
      }
    }
    cursor = data.next_cursor || '';
  } while (cursor);
  return { seconds, calls };
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (!stripeSecret || !elevenKey) return NextResponse.json({ error: 'Billing credentials are incomplete.' }, { status: 503 });

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from('ava_onboardings')
    .select('id,business_name,stripe_session_id,selected_plan,elevenlabs_agent_id')
    .not('stripe_session_id', 'is', null)
    .not('elevenlabs_agent_id', 'is', null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: any[] = [];
  for (const row of rows || []) {
    try {
      const sessionRes = await stripeGet(`/checkout/sessions/${encodeURIComponent(row.stripe_session_id)}`, stripeSecret);
      if (!sessionRes.ok) throw new Error('Stripe session lookup failed');
      const session = sessionRes.data;
      const customer = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      if (!customer || !subscriptionId) throw new Error('Missing Stripe customer/subscription');

      const subRes = await stripeGet(`/subscriptions/${encodeURIComponent(subscriptionId)}`, stripeSecret);
      if (!subRes.ok) throw new Error('Stripe subscription lookup failed');
      const sub = subRes.data;
      const subscriptionItem = sub.items?.data?.[0];
      const start = Number(subscriptionItem?.current_period_start || 0);
      const end = Number(subscriptionItem?.current_period_end || Math.floor(Date.now() / 1000));
      const included = Number(sub.metadata?.included_minutes || 0);
      const overageCents = Number(sub.metadata?.overage_cents || 0);
      if (!start || !included || !overageCents) throw new Error('Subscription usage metadata missing');

      const usage = await elevenUsage(row.elevenlabs_agent_id, start, Math.min(end, Math.floor(Date.now() / 1000)), elevenKey);
      const includedSeconds = included * 60;
      const overageMinutes = Math.max(0, Math.ceil((usage.seconds - includedSeconds) / 60));
      const amount = overageMinutes * overageCents;
      const usageKey = `ava:${subscriptionId}:${start}`;

      const pendingRes = await stripeGet(`/invoiceitems?customer=${encodeURIComponent(customer)}&pending=true&limit=100`, stripeSecret);
      const existing = (pendingRes.data?.data || []).find((x: any) => x.metadata?.ava_usage_key === usageKey);

      const existingAmount = Number(existing?.amount || 0);
      if (existing && (existingAmount !== amount || amount === 0)) {
        const deleted = await stripeDelete(`/invoiceitems/${encodeURIComponent(existing.id)}`, stripeSecret);
        if (!deleted.ok) throw new Error(deleted.data?.error?.message || 'Unable to delete Stripe overage item');
      }
      if (amount > 0 && (!existing || existingAmount !== amount)) {
        const p = new URLSearchParams();
        p.set('customer', customer);
        p.set('subscription', subscriptionId);
        p.set('amount', String(amount));
        p.set('currency', 'usd');
        p.set('description', `Ava overage: ${overageMinutes} minute${overageMinutes === 1 ? '' : 's'} beyond ${included} included minutes`);
        p.set('metadata[ava_usage_key]', usageKey);
        p.set('metadata[overage_minutes]', String(overageMinutes));
        p.set('metadata[included_minutes]', String(included));
        const created = await stripePost('/invoiceitems', stripeSecret, p);
        if (!created.ok) throw new Error(created.data?.error?.message || 'Unable to create Stripe overage item');
      }

      results.push({ onboardingId: row.id, business: row.business_name, calls: usage.calls, seconds: usage.seconds, includedMinutes: included, overageMinutes, pendingCharge: amount / 100, ok: true });
    } catch (e) {
      results.push({ onboardingId: row.id, business: row.business_name, ok: false, error: e instanceof Error ? e.message : 'Unknown billing error' });
    }
  }

  return NextResponse.json({ reconciledAt: new Date().toISOString(), customers: results });
}
