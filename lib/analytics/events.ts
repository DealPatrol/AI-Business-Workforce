import { adsSendTo, readGa4Id, readGoogleAdsCheckoutLabel, readGoogleAdsDemoLabel, readGoogleAdsOnboardingLabel, readMetaPixelId } from '@/lib/analytics/config';
import { metaPhoneDigits, normalizeEmail, toE164 } from '@/lib/analytics/contact';
import { readAttribution, readBrowserIds } from '@/lib/analytics/attribution';

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
    fbq?: (...args: unknown[]) => void;
  }
}

export type TrackedEventName = 'Lead' | 'InitiateCheckout' | 'DemoStarted' | 'ViewContent';

function newEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ava-${Date.now()}`;
}

function gtagEvent(name: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}

function googleConversion(label: string, eventId: string) {
  const sendTo = adsSendTo(label);
  if (!sendTo) return;
  gtagEvent('conversion', { send_to: sendTo, transaction_id: eventId });
}

function metaTrack(command: 'track' | 'trackCustom', name: string, eventId: string, params?: Record<string, string>) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function' || !readMetaPixelId()) return;
  window.fbq(command, name, params || {}, { eventID: eventId });
}

function postServerEvent(eventName: TrackedEventName, eventId: string, extra?: { email?: string; phone?: string }) {
  if (typeof window === 'undefined' || !readMetaPixelId()) return;
  const { fbp, fbc } = readBrowserIds();
  const body = JSON.stringify({
    eventName,
    eventId,
    pageUrl: window.location.href,
    fbp,
    fbc,
    email: extra?.email || '',
    phone: extra?.phone || '',
    attribution: readAttribution(),
  });
  void fetch('/api/analytics/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function trackViewContent(path: string) {
  const eventId = newEventId();
  if (readGa4Id()) gtagEvent('view_content', { page_path: path, transaction_id: eventId });
  metaTrack('track', 'ViewContent', eventId);
  postServerEvent('ViewContent', eventId);
}

export function trackDemoStarted() {
  const eventId = newEventId();
  googleConversion(readGoogleAdsDemoLabel(), eventId);
  if (readGa4Id()) gtagEvent('demo_started', { transaction_id: eventId });
  metaTrack('trackCustom', 'DemoStarted', eventId);
  postServerEvent('DemoStarted', eventId);
  return eventId;
}

export function trackCheckoutStarted(plan?: string) {
  const eventId = newEventId();
  googleConversion(readGoogleAdsCheckoutLabel(), eventId);
  if (readGa4Id()) gtagEvent('begin_checkout', { transaction_id: eventId, plan: plan || undefined });
  metaTrack('track', 'InitiateCheckout', eventId);
  postServerEvent('InitiateCheckout', eventId);
  return eventId;
}

export function trackOnboardingSubmitted(input: { eventId: string; email?: string; phone?: string }) {
  const eventId = input.eventId || newEventId();
  const email = normalizeEmail(input.email);
  const phone = toE164(input.phone);
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && (email || phone)) {
    window.gtag('set', 'user_data', {
      ...(email ? { email } : {}),
      ...(phone ? { phone_number: phone } : {}),
    });
  }
  googleConversion(readGoogleAdsOnboardingLabel(), eventId);
  if (readGa4Id()) gtagEvent('generate_lead', { transaction_id: eventId });

  const pixelId = readMetaPixelId();
  if (typeof window !== 'undefined' && typeof window.fbq === 'function' && pixelId) {
    const userData: Record<string, string> = {};
    if (email) userData.em = email;
    const digits = metaPhoneDigits(phone);
    if (digits) userData.ph = digits;
    if (Object.keys(userData).length > 0) window.fbq('init', pixelId, userData);
    window.fbq('track', 'Lead', {}, { eventID: eventId });
  }
  return eventId;
}
