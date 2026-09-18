import { NextRequest, NextResponse } from 'next/server';

const PLANS = {
  starter: { name: 'Ava Starter', monthly: 5900, minutes: 250, overage: 25 },
  growth: { name: 'Ava Growth', monthly: 12900, minutes: 650, overage: 22 },
  pro: { name: 'Ava Pro', monthly: 24900, minutes: 1300, overage: 20 },
} as const;

type PlanKey = keyof typeof PLANS;

function sanitizeQualificationId(value: unknown) {
  const id = String(value || '').trim();
  // UUID v4-ish / uuid string — keep URL-safe only
  if (!id || id.length > 80 || !/^[a-zA-Z0-9_-]+$/.test(id)) return '';
  return id;
}

function sanitizePrefillToken(value: unknown) {
  const token = String(value || '').trim();
  // base64url.body.base64url.sig
  if (!token || token.length > 400 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return '';
  return token;
}

async function createAvaCheckout(
  req: NextRequest,
  planKey: PlanKey,
  qualificationId?: string,
  prefillToken?: string,
) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return { error: NextResponse.json({ error: 'Ava checkout is not connected yet.' }, { status: 503 }) };
  }

  const plan = PLANS[planKey];
  if (!plan) {
    return { error: NextResponse.json({ error: 'Invalid Ava plan.' }, { status: 400 }) };
  }

  const origin = req.nextUrl.origin;
  const qid = sanitizeQualificationId(qualificationId);
  const token = sanitizePrefillToken(prefillToken);
  const successParts = [
    `session_id={CHECKOUT_SESSION_ID}`,
    `plan=${planKey}`,
    ...(qid ? [`qualificationId=${encodeURIComponent(qid)}`] : []),
    ...(token ? [`prefillToken=${encodeURIComponent(token)}`] : []),
  ];
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('success_url', `${origin}/onboarding/ava?${successParts.join('&')}`);
  params.set('cancel_url', `${origin}/ava#pricing`);
  params.set('billing_address_collection', 'auto');
  params.set('allow_promotion_codes', 'true');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'usd');
  params.set('line_items[0][price_data][unit_amount]', String(plan.monthly));
  params.set('line_items[0][price_data][recurring][interval]', 'month');
  params.set('line_items[0][price_data][product_data][name]', plan.name);
  params.set(
    'line_items[0][price_data][product_data][description]',
    `${plan.minutes} included voice minutes/month; overage $${(plan.overage / 100).toFixed(2)}/minute.`,
  );
  params.set('metadata[product]', 'ava');
  params.set('metadata[plan]', planKey);
  params.set('metadata[included_minutes]', String(plan.minutes));
  params.set('metadata[overage_cents]', String(plan.overage));
  if (qid) params.set('metadata[qualification_id]', qid);
  params.set('subscription_data[metadata][product]', 'ava');
  params.set('subscription_data[metadata][plan]', planKey);
  params.set('subscription_data[metadata][included_minutes]', String(plan.minutes));
  params.set('subscription_data[metadata][overage_cents]', String(plan.overage));
  if (qid) params.set('subscription_data[metadata][qualification_id]', qid);

  const stripe = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await stripe.json();
  if (!stripe.ok || !data.url) {
    console.error('Stripe Ava checkout error', data);
    return {
      error: NextResponse.json(
        { error: data?.error?.message || 'Could not start Ava checkout.' },
        { status: 500 },
      ),
    };
  }
  return { url: String(data.url) };
}

export async function GET(req: NextRequest) {
  try {
    const planKey = String(req.nextUrl.searchParams.get('plan') || '').toLowerCase() as PlanKey;
    const qualificationId = req.nextUrl.searchParams.get('qualificationId') || '';
    const prefillToken =
      req.nextUrl.searchParams.get('prefillToken') ||
      req.nextUrl.searchParams.get('token') ||
      '';
    if (!PLANS[planKey]) return NextResponse.redirect(new URL('/ava#pricing', req.url));
    const result = await createAvaCheckout(req, planKey, qualificationId, prefillToken);
    if ('error' in result) return NextResponse.redirect(new URL('/ava#pricing', req.url));
    return NextResponse.redirect(result.url, 303);
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL('/ava#pricing', req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const planKey = String(body?.plan || '').toLowerCase() as PlanKey;
    const qualificationId = String(body?.qualificationId || '');
    const prefillToken = String(body?.prefillToken || body?.token || '');
    if (!PLANS[planKey]) return NextResponse.json({ error: 'Invalid Ava plan.' }, { status: 400 });
    const result = await createAvaCheckout(req, planKey, qualificationId, prefillToken);
    if ('error' in result) return result.error;
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not start Ava checkout.' }, { status: 500 });
  }
}
