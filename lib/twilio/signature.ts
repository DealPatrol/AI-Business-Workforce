import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Compute Twilio's X-Twilio-Signature for a webhook request.
 * Algorithm: HMAC-SHA1(authToken, fullUrl + concat(sorted(key + value))) in base64.
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
export function computeTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
): string {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  return createHmac('sha1', authToken).update(Buffer.from(data, 'utf8')).digest('base64');
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Validate an X-Twilio-Signature header. Accepts a list of candidate URLs because
 * the public URL Twilio signed can differ from the URL the server sees behind a proxy.
 */
export function validateTwilioSignature(opts: {
  authToken: string;
  signature: string;
  urls: string[];
  params: Record<string, string>;
}): boolean {
  const { authToken, signature, params } = opts;
  if (!authToken || !signature) return false;
  const urls = Array.from(new Set(opts.urls.filter(Boolean)));
  return urls.some((url) => safeEqual(computeTwilioSignature(authToken, url, params), signature));
}
