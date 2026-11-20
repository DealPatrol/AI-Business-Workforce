import { downloadPathForSession } from '@/lib/lead-lists/hot-download';
import {
  HOT_LEADS_500_OFFER,
  HOT_LEADS_500_PAYMENT_LINK_ID,
  LEAD_LIST_LINKS,
} from '@/lib/lead-lists/offers';

const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2026-07-29.dahlia';
const SESSION_ID_RE = /^cs_(?:test_|live_)[A-Za-z0-9]+$/;

export type StripeCheckoutSession = {
  id?: string;
  status?: string;
  payment_status?: string;
  payment_link?: string | { id?: string | null } | null;
  metadata?: Record<string, string> | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  custom_fields?: Array<{
    key?: string;
    text?: { value?: string | null } | null;
    dropdown?: { value?: string | null } | null;
  }> | null;
};

export type HotThanksView = {
  showAddon: boolean;
  showDownload: boolean;
  downloadHref: string;
  email: string;
  addonHref: string;
  sessionId: string;
};

function paymentLinkId(session: StripeCheckoutSession): string {
  if (typeof session.payment_link === 'string') return session.payment_link;
  if (session.payment_link && typeof session.payment_link.id === 'string') return session.payment_link.id;
  return '';
}

export function customFieldValue(session: StripeCheckoutSession, key: string): string {
  const fields = Array.isArray(session.custom_fields) ? session.custom_fields : [];
  const field = fields.find((item) => item.key === key);
  const value = field?.text?.value || field?.dropdown?.value || '';
  return value.trim();
}

export function checkoutEmail(session: StripeCheckoutSession): string {
  const email = session.customer_details?.email || session.customer_email || '';
  return email.trim();
}

export function isPaidCheckoutSession(session: StripeCheckoutSession): boolean {
  return session.status === 'complete' && (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');
}

export function isHotLeads500Order(session: StripeCheckoutSession): boolean {
  return paymentLinkId(session) === HOT_LEADS_500_PAYMENT_LINK_ID || session.metadata?.offer === HOT_LEADS_500_OFFER;
}

export function isValidCheckoutSessionId(sessionId: string): boolean {
  return SESSION_ID_RE.test(sessionId.trim());
}

export function addonCheckoutHref(baseUrl: string, email?: string): string {
  const trimmed = (email || '').trim();
  if (!trimmed || !trimmed.includes('@')) return baseUrl;
  const url = new URL(baseUrl);
  url.searchParams.set('prefilled_email', trimmed);
  return url.toString();
}

export function genericHotThanksView(addonUrl: string = LEAD_LIST_LINKS.hotAddon1000): HotThanksView {
  return {
    showAddon: false,
    showDownload: false,
    downloadHref: '',
    email: '',
    addonHref: addonUrl,
    sessionId: '',
  };
}

export function hotThanksViewFromSession(
  session: StripeCheckoutSession,
  options?: { secretConfigured?: boolean; addonUrl?: string; sessionId?: string },
): HotThanksView {
  const addonUrl = options?.addonUrl ?? LEAD_LIST_LINKS.hotAddon1000;
  const hidden = genericHotThanksView(addonUrl);
  if (options?.secretConfigured === false) return hidden;
  if (!isPaidCheckoutSession(session) || !isHotLeads500Order(session)) return hidden;
  const email = checkoutEmail(session);
  const sessionId = (options?.sessionId || session.id || '').trim();
  return {
    showAddon: true,
    showDownload: true,
    downloadHref: sessionId && isValidCheckoutSessionId(sessionId) ? downloadPathForSession(sessionId) : '',
    email,
    addonHref: addonCheckoutHref(addonUrl, email),
    sessionId,
  };
}

function stripeSecret(): string {
  return process.env.STRIPE_SECRET_KEY?.trim() || '';
}

export async function fetchCheckoutSession(sessionId: string | null | undefined): Promise<StripeCheckoutSession | null> {
  const secret = stripeSecret();
  const id = (sessionId || '').trim();
  if (!secret || !isValidCheckoutSessionId(id)) return null;

  try {
    const response = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: `Bearer ${secret}`,
        'Stripe-Version': STRIPE_VERSION,
      },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()) as StripeCheckoutSession;
  } catch {
    return null;
  }
}

export async function loadHotThanks(sessionId: string | null | undefined): Promise<HotThanksView> {
  const hidden = genericHotThanksView();
  const id = (sessionId || '').trim();
  const session = await fetchCheckoutSession(id);
  if (!session) return hidden;
  return hotThanksViewFromSession(session, { secretConfigured: true, sessionId: id });
}
