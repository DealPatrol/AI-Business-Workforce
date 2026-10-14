import { STRIPE_API_VERSION } from '@/lib/stripe-checkout';
import { readPostcardSetupRecord } from '@/lib/postcards/orders';
import {
  normalizePostcardEmail,
  sanitizeStripeCustomerId,
  setupStatusFromStripeData,
  type PostcardCheckoutSnapshot,
  type StripeCustomerSnapshot,
} from '@/lib/postcards/setup-fee';

const STRIPE_API = 'https://api.stripe.com/v1';

type StripeList<T> = {
  data?: T[];
  has_more?: boolean;
  error?: { message?: string };
};

async function stripeGet(secret: string, path: string) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    headers: {
      Authorization: `Bearer ${secret}`,
      'Stripe-Version': STRIPE_API_VERSION,
    },
    cache: 'no-store',
  });
  const data = (await response.json().catch(() => ({}))) as StripeList<StripeCustomerSnapshot>;
  if (!response.ok) {
    throw new Error(data.error?.message || 'Stripe lookup failed.');
  }
  return data;
}

async function listCustomersByEmail(secret: string, email: string) {
  try {
    const searched = await stripeGet(
      secret,
      `/customers/search?query=${encodeURIComponent(`email:"${email}"`)}&limit=10`,
    );
    if (Array.isArray(searched.data) && searched.data.length > 0) return searched.data;
  } catch (error) {
    console.error('Stripe customer search failed', error);
  }
  const listed = await stripeGet(secret, `/customers?email=${encodeURIComponent(email)}&limit=10`);
  return Array.isArray(listed.data) ? listed.data : [];
}

async function listCheckoutSessions(secret: string, customerId: string) {
  const sessions: PostcardCheckoutSnapshot[] = [];
  let startingAfter = '';
  for (let page = 0; page < 3; page += 1) {
    const query = new URLSearchParams({ customer: customerId, limit: '100' });
    if (startingAfter) query.set('starting_after', startingAfter);
    const data = await stripeGet(secret, `/checkout/sessions?${query.toString()}`);
    const batch = (Array.isArray(data.data) ? data.data : []) as PostcardCheckoutSnapshot[];
    sessions.push(...batch);
    if (!data.has_more || batch.length === 0) break;
    startingAfter = batch[batch.length - 1]?.id || '';
    if (!startingAfter) break;
  }
  return sessions;
}

export async function lookupStripePostcardSetup(secret: string, email: string) {
  const normalized = normalizePostcardEmail(email);
  if (!normalized || !secret) return { paid: false, customerId: '' };
  const customers = await listCustomersByEmail(secret, normalized);
  const sessionsByCustomer: Record<string, PostcardCheckoutSnapshot[]> = {};
  for (const customer of customers) {
    const id = sanitizeStripeCustomerId(customer.id);
    if (!id) continue;
    sessionsByCustomer[id] = await listCheckoutSessions(secret, id);
  }
  return setupStatusFromStripeData({ email: normalized, customers, sessionsByCustomer });
}

export async function lookupPostcardSetup(email: string) {
  const normalized = normalizePostcardEmail(email);
  if (!normalized) return { paid: false, customerId: '' };

  let fromDb = { paid: false, customerId: '' };
  try {
    fromDb = await readPostcardSetupRecord(normalized);
  } catch (error) {
    console.error('Postcard setup record lookup failed', error);
  }
  if (fromDb.paid && fromDb.customerId) return fromDb;

  const secret = process.env.STRIPE_SECRET_KEY?.trim() || '';
  if (!secret) return fromDb;

  try {
    const fromStripe = await lookupStripePostcardSetup(secret, normalized);
    return {
      paid: fromDb.paid || fromStripe.paid,
      customerId: fromStripe.customerId || fromDb.customerId,
    };
  } catch (error) {
    console.error('Stripe postcard customer lookup failed', error);
    if (fromDb.paid) return fromDb;
    throw error;
  }
}
