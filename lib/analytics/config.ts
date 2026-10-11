const GOOGLE_ADS_ID = /^AW-\d{5,20}$/;
const GA4_ID = /^G-[A-Z0-9]{4,20}$/i;
const META_PIXEL_ID = /^\d{5,20}$/;
const CONVERSION_LABEL = /^[A-Za-z0-9_-]{1,40}$/;

function match(value: string | undefined, pattern: RegExp) {
  const trimmed = value?.trim() || '';
  return pattern.test(trimmed) ? trimmed : '';
}

/** Google Ads tag ID (AW-…). Empty when unset or not a valid ID. */
export function readGoogleAdsId() {
  return match(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID, GOOGLE_ADS_ID);
}

/** Optional GA4 measurement ID (G-…). Empty when unset or not a valid ID. */
export function readGa4Id() {
  return match(process.env.NEXT_PUBLIC_GA4_ID, GA4_ID);
}

/** Meta Pixel ID. Empty when unset or not numeric. */
export function readMetaPixelId() {
  return match(process.env.NEXT_PUBLIC_META_PIXEL_ID, META_PIXEL_ID);
}

export function readGoogleAdsOnboardingLabel() {
  return match(process.env.NEXT_PUBLIC_GOOGLE_ADS_ONBOARDING_LABEL, CONVERSION_LABEL);
}

export function readGoogleAdsCheckoutLabel() {
  return match(process.env.NEXT_PUBLIC_GOOGLE_ADS_CHECKOUT_LABEL, CONVERSION_LABEL);
}

export function readGoogleAdsDemoLabel() {
  return match(process.env.NEXT_PUBLIC_GOOGLE_ADS_DEMO_LABEL, CONVERSION_LABEL);
}

export function adsSendTo(label: string) {
  const id = readGoogleAdsId();
  if (!id || !label) return '';
  return `${id}/${label}`;
}
