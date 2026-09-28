import { createHash } from 'crypto';
import { metaPhoneDigits, normalizeEmail } from '@/lib/analytics/contact';
import { readMetaPixelId } from '@/lib/analytics/config';

export type MetaServerEventName = 'Lead' | 'InitiateCheckout' | 'DemoStarted' | 'ViewContent';

export type MetaServerEventInput = {
  eventName: MetaServerEventName;
  eventId: string;
  eventSourceUrl?: string;
  email?: string;
  phone?: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
};

export type MetaServerEventResult = {
  sent: boolean;
  skipped: boolean;
};

function serverEnv(name: string) {
  return process.env[name]?.trim() || '';
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function isMetaServerEventName(value: string): value is MetaServerEventName {
  switch (value) {
    case 'Lead':
    case 'InitiateCheckout':
    case 'DemoStarted':
    case 'ViewContent':
      return true;
    default:
      return false;
  }
}

function eventNameForApi(eventName: MetaServerEventName): MetaServerEventName {
  switch (eventName) {
    case 'Lead':
    case 'InitiateCheckout':
    case 'DemoStarted':
    case 'ViewContent':
      return eventName;
    default: {
      const exhaustive: never = eventName;
      return exhaustive;
    }
  }
}

export function parseMetaServerEventName(value: unknown): MetaServerEventName | null {
  const name = String(value || '');
  return isMetaServerEventName(name) ? name : null;
}

function pixelId() {
  const serverId = serverEnv('META_PIXEL_ID');
  if (/^\d{5,20}$/.test(serverId)) return serverId;
  return readMetaPixelId();
}

/**
 * Sends one website event to the Meta Conversions API.
 * No-ops when META_CAPI_TOKEN or a pixel ID is missing. Never throws.
 */
export async function sendMetaServerEvent(input: MetaServerEventInput): Promise<MetaServerEventResult> {
  const token = serverEnv('META_CAPI_TOKEN');
  const pixel = pixelId();
  if (!token || !pixel) return { sent: false, skipped: true };

  const email = normalizeEmail(input.email);
  const phone = metaPhoneDigits(input.phone);
  const userData: Record<string, string | string[]> = {};
  if (email) userData.em = [sha256(email)];
  if (phone) userData.ph = [sha256(phone)];
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  const event: Record<string, unknown> = {
    event_name: eventNameForApi(input.eventName),
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: 'website',
    user_data: userData,
  };
  if (input.eventSourceUrl) event.event_source_url = input.eventSourceUrl;

  const body: Record<string, unknown> = {
    data: [event],
    access_token: token,
  };
  const testCode = serverEnv('META_CAPI_TEST_EVENT_CODE');
  if (testCode) body.test_event_code = testCode;

  try {
    const response = await fetch(`https://graph.facebook.com/v23.0/${pixel}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error('Meta CAPI request failed', response.status);
      return { sent: false, skipped: false };
    }
    return { sent: true, skipped: false };
  } catch (error) {
    console.error('Meta CAPI request failed', error instanceof Error ? error.message : 'unknown');
    return { sent: false, skipped: false };
  }
}
