export type MailMode = 'test' | 'live';

export type MailConfig = {
  mode: MailMode;
  liveEnabled: boolean;
  pricePerCardCents: number | null;
  postcardSize: '4x6' | '6x9';
  returnAddress: {
    name: string;
    company: string | null;
    address_line1: string;
    address_line2: string | null;
    address_city: string;
    address_state: string;
    address_zip: string;
    address_country: 'US';
  } | null;
};

function enabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

function configuredPrice(): number | null {
  const raw = process.env.MAIL_PRICE_PER_CARD_CENTS?.trim();
  if (!raw || !/^\d+$/.test(raw)) return null;
  const cents = Number(raw);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function getMailConfig(): MailConfig {
  const requestedMode = process.env.LOB_MODE?.trim().toLowerCase();
  const liveEnabled = enabled(process.env.MAIL_LIVE_ENABLED);
  const mode: MailMode = requestedMode === 'live' && liveEnabled ? 'live' : 'test';
  const postcardSize = process.env.LOB_POSTCARD_SIZE?.trim() === '4x6' ? '4x6' : '6x9';
  const addressLine1 = process.env.MAIL_RETURN_ADDRESS_LINE1?.trim();
  const city = process.env.MAIL_RETURN_ADDRESS_CITY?.trim();
  const state = process.env.MAIL_RETURN_ADDRESS_STATE?.trim();
  const zip = process.env.MAIL_RETURN_ADDRESS_ZIP?.trim();
  const name = process.env.MAIL_RETURN_NAME?.trim();

  return {
    mode,
    liveEnabled,
    pricePerCardCents: configuredPrice(),
    postcardSize,
    returnAddress:
      addressLine1 && city && state && zip && name
        ? {
            name,
            company: process.env.MAIL_RETURN_COMPANY?.trim() || null,
            address_line1: addressLine1,
            address_line2: process.env.MAIL_RETURN_ADDRESS_LINE2?.trim() || null,
            address_city: city,
            address_state: state,
            address_zip: zip,
            address_country: 'US',
          }
        : null,
  };
}

export function streetViewPostcardEnabled(): boolean {
  return enabled(process.env.STREET_VIEW_POSTCARD_ENABLED);
}

export function streetViewStorageEnabled(): boolean {
  return enabled(process.env.GOOGLE_STREET_VIEW_STORAGE_ENABLED);
}

export function calculateCampaignCost(
  recipientCount: number,
  pricePerCardCents: number | null,
): number | null {
  if (pricePerCardCents == null || recipientCount < 0) return null;
  return recipientCount * pricePerCardCents;
}
