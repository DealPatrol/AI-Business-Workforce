import { createClient } from '@/lib/supabase/server';
import { readPostcardSetupRecord } from '@/lib/postcards/orders';
import { decidePostcardSetupCharge, type PostcardSetupDecision } from '@/lib/postcards/setup-fee';

const CHARGE_SETUP: PostcardSetupDecision = { includeSetup: true, customerId: '', customerEmail: '' };

/** Signed-in Supabase user. Email confirmation is checked by the setup decision. */
export async function readPostcardBuyer() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return {
      email: data.user.email,
      emailConfirmedAt: data.user.email_confirmed_at,
    };
  } catch (error) {
    console.error('Postcard buyer session lookup failed', error);
    return null;
  }
}

/**
 * Charge setup unless this request's verified user has a webhook-written paid
 * postcard_orders row. Never searches Stripe and never reads a client email.
 */
export async function postcardSetupForCheckout(): Promise<PostcardSetupDecision> {
  const buyer = await readPostcardBuyer();
  const email = buyer?.emailConfirmedAt ? buyer.email || '' : '';
  if (!email) return CHARGE_SETUP;
  try {
    const record = await readPostcardSetupRecord(email);
    return decidePostcardSetupCharge({
      buyer,
      paidSetup: record.paid ? { customerId: record.customerId } : null,
    });
  } catch (error) {
    console.error('Postcard setup record lookup failed; charging the setup fee', error);
    return CHARGE_SETUP;
  }
}
