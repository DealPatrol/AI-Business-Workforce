import { createAdminClient } from '@/lib/supabase/admin';
import {
  isPostcardCheckoutProduct,
  LEGACY_POSTCARD_CHECKOUT_PRODUCT,
  POSTCARD_CHECKOUT_PRODUCT,
} from '@/lib/stripe-checkout';
import { normalizePostcardEmail, sanitizeStripeCustomerId } from '@/lib/postcards/setup-fee';

export type PostcardOrderWrite = {
  sessionId: string;
  customerId: string;
  email: string;
  product: string;
  size: string;
  quantity: number | null;
  setupCents: number;
  setupCharged: boolean;
  paymentStatus: string;
};

function adminOrNull() {
  try {
    return createAdminClient();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function readPostcardSetupRecord(email: string) {
  const normalized = normalizePostcardEmail(email);
  if (!normalized) return { paid: false, customerId: '' };
  const supabase = adminOrNull();
  if (!supabase) return { paid: false, customerId: '' };

  const { data, error } = await supabase
    .from('postcard_orders')
    .select('stripe_customer_id')
    .eq('email', normalized)
    .eq('payment_status', 'paid')
    .eq('setup_charged', true)
    .in('product', [POSTCARD_CHECKOUT_PRODUCT, LEGACY_POSTCARD_CHECKOUT_PRODUCT])
    .limit(1);
  if (error) throw new Error(`Unable to load postcard setup: ${error.message}`);
  const row = data?.[0] as { stripe_customer_id?: string | null } | undefined;
  if (!row) return { paid: false, customerId: '' };
  return { paid: true, customerId: sanitizeStripeCustomerId(row.stripe_customer_id) };
}

export async function recordPostcardOrder(input: PostcardOrderWrite) {
  const email = normalizePostcardEmail(input.email);
  if (!input.sessionId || !email) return;
  if (input.paymentStatus !== 'paid') return;
  if (!isPostcardCheckoutProduct(input.product)) return;

  const supabase = adminOrNull();
  if (!supabase) return;

  const setupCents =
    input.setupCharged && Number.isFinite(input.setupCents) && input.setupCents > 0
      ? Math.round(input.setupCents)
      : 0;
  const { error } = await supabase.from('postcard_orders').upsert(
    {
      stripe_checkout_session_id: input.sessionId,
      stripe_customer_id: sanitizeStripeCustomerId(input.customerId) || null,
      email,
      product: input.product,
      size: input.size || null,
      quantity: input.quantity,
      setup_cents: setupCents,
      setup_charged: input.setupCharged,
      payment_status: 'paid',
    },
    { onConflict: 'stripe_checkout_session_id' },
  );
  if (error) throw new Error(`Unable to store postcard order: ${error.message}`);
}
