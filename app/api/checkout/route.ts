import { NextRequest, NextResponse } from 'next/server';

const PLANS = {
  starter: { name: 'Ava Starter', monthly: 9900 },
  growth: { name: 'Ava Growth', monthly: 24900 },
  pro: { name: 'Ava Pro', monthly: 49900 },
} as const;

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Checkout is not connected yet.' }, { status: 503 });

    const body = await req.json();
    const planKey = String(body?.plan || '').toLowerCase() as keyof typeof PLANS;
    const plan = PLANS[planKey];
    if (!plan) return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });

    const origin = req.nextUrl.origin;
    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('success_url', `${origin}/onboarding?session_id={CHECKOUT_SESSION_ID}&plan=${planKey}`);
    params.set('cancel_url', `${origin}/receptionist-demo#pricing`);
    params.set('billing_address_collection', 'auto');
    params.set('allow_promotion_codes', 'true');
    params.set('customer_creation', 'always');
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', String(plan.monthly));
    params.set('line_items[0][price_data][recurring][interval]', 'month');
    params.set('line_items[0][price_data][product_data][name]', plan.name);
    params.set('line_items[1][quantity]', '1');
    params.set('line_items[1][price_data][currency]', 'usd');
    params.set('line_items[1][price_data][unit_amount]', '29900');
    params.set('line_items[1][price_data][product_data][name]', 'Ava Founding Setup');
    params.set('metadata[plan]', planKey);

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
      console.error('Stripe checkout error', data);
      return NextResponse.json({ error: data?.error?.message || 'Could not start checkout.' }, { status: 500 });
    }
    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 });
  }
}
