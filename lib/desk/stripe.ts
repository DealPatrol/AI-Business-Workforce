/** Server-only Stripe reads for the Desk: subscription period and the customer portal. Never throws. */
const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2026-07-29.dahlia';

export type DeskSubscription = {
  status: string;
  priceId: string | null;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: number | null;
};

const STRIPE_ID = /^(sub|cus)_[A-Za-z0-9]+$/;

function secret() {
  return process.env.STRIPE_SECRET_KEY?.trim() || '';
}

export function parseSubscription(data: Record<string, unknown>): DeskSubscription {
  const items = (data.items as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? [];
  const item = items[0] ?? {};
  const price = (item.price as Record<string, unknown> | undefined) ?? {};
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  return {
    status: typeof data.status === 'string' ? data.status : 'unknown',
    priceId: typeof price.id === 'string' ? price.id : null,
    currentPeriodStart: num(item.current_period_start) ?? num(data.current_period_start),
    currentPeriodEnd: num(item.current_period_end) ?? num(data.current_period_end),
    cancelAtPeriodEnd: data.cancel_at_period_end === true,
    cancelAt: num(data.cancel_at),
  };
}

export async function loadDeskSubscription(subscriptionId: string | null | undefined): Promise<DeskSubscription | null> {
  const id = String(subscriptionId || '').trim();
  const key = secret();
  if (!key || !STRIPE_ID.test(id) || !id.startsWith('sub_')) return null;
  try {
    const res = await fetch(`${STRIPE_API}/subscriptions/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${key}`, 'Stripe-Version': STRIPE_VERSION },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return parseSubscription((await res.json()) as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** A one-time Stripe customer portal link for this customer, or null. */
export async function createPortalSession(customerId: string | null | undefined, returnUrl: string) {
  const id = String(customerId || '').trim();
  const key = secret();
  if (!key || !STRIPE_ID.test(id) || !id.startsWith('cus_')) return null;
  const params = new URLSearchParams({ customer: id, return_url: returnUrl });
  const configuration = process.env.STRIPE_PORTAL_CONFIGURATION_ID?.trim();
  if (configuration && /^bpc_[A-Za-z0-9]+$/.test(configuration)) params.set('configuration', configuration);
  try {
    const res = await fetch(`${STRIPE_API}/billing_portal/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Stripe-Version': STRIPE_VERSION,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string };
    return res.ok && typeof data.url === 'string' && data.url.startsWith('https://') ? data.url : null;
  } catch {
    return null;
  }
}
