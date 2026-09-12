import { NextRequest, NextResponse } from 'next/server';

const PLANS = {
  starter: { name: 'Ava Starter', monthly: 9900 },
  growth: { name: 'Ava Growth', monthly: 24900 },
  pro: { name: 'Ava Pro', monthly: 49900 },
} as const;

type PlanKey = keyof typeof PLANS;

async function createAvaCheckout(req: NextRequest, planKey: PlanKey) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return { error: NextResponse.json({ error: 'Ava checkout is not connected yet.' }, { status: 503 }) };
  }

  const plan = PLANS[planKey];
  if (!plan) {
    return { error: NextResponse.json({ error: 'Invalid Ava plan.' }, { status: 400 }) };
  }

  const origin = req.nextUrl.origin;
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set(
    'success_url',
    `${origin}/onboarding/ava?session_id={CHECKOUT_SESSION_ID}&plan=${planKey}`,
  );
  params.set('cancel_url', `${origin}/ava#pricing`);
  params.set('billing_address_collection', 'auto');
  params.set('allow_promotion_codes', 'true');

  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'usd');
  params.set('line_items[0][price_data][unit_amount]', String(plan.monthly));
  params.set('line_items[0][price_data][recurring][interval]', 'month');
  params.set('line_items[0][price_data][product_data][name]', plan.name);

  params.set('line_items[1][quantity]', '1');
  params.set('line_items[1][price_data][currency]', 'usd');
  params.set('line_items[1][price_data][unit_amount]', '29900');
  params.set('line_items[1][price_data][product_data][name]', 'Ava Founding Setup');

  params.set('metadata[product]', 'ava');
  params.set('metadata[plan]', planKey);
  params.set('subscription_data[metadata][product]', 'ava');
  params.set('subscription_data[metadata][plan]', planKey);

  const stripe = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
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
    if (!PLANS[planKey]) {
      return NextResponse.redirect(new URL('/ava#pricing', req.url));
    }

    const result = await createAvaCheckout(req, planKey);
    if ('error' in result) return result.error;
    return NextResponse.redirect(result.url, 303);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not start Ava checkout.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const planKey = String(body?.plan || '').toLowerCase() as PlanKey;
    if (!PLANS[planKey]) {
      return NextResponse.json({ error: 'Invalid Ava plan.' }, { status: 400 });
    }

    const result = await createAvaCheckout(req, planKey);
    if ('error' in result) return result.error;
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not start Ava checkout.' }, { status: 500 });
  }
}
