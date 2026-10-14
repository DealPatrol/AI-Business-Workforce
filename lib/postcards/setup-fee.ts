import {
  isPostcardCheckoutProduct,
  LEGACY_POSTCARD_CHECKOUT_PRODUCT,
} from '@/lib/stripe-checkout';

const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export function normalizePostcardEmail(value: unknown) {
  const email = String(value || '').trim().toLowerCase();
  if (!email || email.length > 320 || !EMAIL_PATTERN.test(email)) return '';
  return email;
}

export function sanitizeStripeCustomerId(value: unknown) {
  const id = String(value || '').trim();
  return /^cus_[A-Za-z0-9]+$/.test(id) ? id : '';
}

type SetupMetadata = Record<string, string | number | boolean | null | undefined> | null | undefined;

/** True when this postcard checkout included the one-time setup fee. */
export function postcardSetupWasCharged(product: string | null | undefined, metadata: SetupMetadata) {
  if (!isPostcardCheckoutProduct(product)) return false;
  const record = metadata || {};
  const charged = record.setup_charged;
  if (charged === false || charged === 'false' || charged === 0 || charged === '0') return false;
  if (charged === true || charged === 'true' || charged === 1 || charged === '1') return true;
  const setupCents = Number(record.setup_cents);
  if (Number.isFinite(setupCents) && setupCents > 0) return true;
  return product === LEGACY_POSTCARD_CHECKOUT_PRODUCT;
}

export type PostcardCheckoutSnapshot = {
  id?: string;
  payment_status?: string | null;
  metadata?: SetupMetadata;
};

/** A completed payment that already collected the postcard setup fee. */
export function paidPostcardOrderCountsAsSetup(session: PostcardCheckoutSnapshot) {
  if (session.payment_status !== 'paid') return false;
  const product = typeof session.metadata?.product === 'string' ? session.metadata.product : '';
  return postcardSetupWasCharged(product, session.metadata);
}

export type StripeCustomerSnapshot = {
  id?: string;
  email?: string | null;
};

export function setupStatusFromStripeData(input: {
  email: string;
  customers: StripeCustomerSnapshot[];
  sessionsByCustomer: Record<string, PostcardCheckoutSnapshot[]>;
}) {
  const email = normalizePostcardEmail(input.email);
  if (!email) return { paid: false, customerId: '' };

  let customerId = '';
  for (const customer of input.customers) {
    const id = sanitizeStripeCustomerId(customer.id);
    if (!id) continue;
    if (customer.email && normalizePostcardEmail(customer.email) !== email) continue;
    if (!customerId) customerId = id;
    const sessions = input.sessionsByCustomer[id] || [];
    if (sessions.some(paidPostcardOrderCountsAsSetup)) {
      return { paid: true, customerId: id };
    }
  }
  return { paid: false, customerId };
}
