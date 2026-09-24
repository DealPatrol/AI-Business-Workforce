import { createHash } from 'node:crypto';

export const PUBLIC_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

export type PublicRecipient = {
  id: string;
  public_token: string;
  homeowner_name: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  concept_image_url: string | null;
  concept_summary: string | null;
  current_image_url: string | null;
  current_image_source: 'crew_photo' | 'owner_upload' | null;
  after_image_url: string | null;
  review_status: string | null;
  campaigns: {
    business_name: string;
    business_phone: string | null;
    business_email: string | null;
    status: 'active';
  };
};

export function formatRecipientAddress(recipient: {
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
}) {
  return [
    recipient.address_line_1,
    recipient.address_line_2,
    `${recipient.city}, ${recipient.state} ${recipient.postal_code}`,
  ].filter(Boolean);
}

export function hashRequestSource(headers: Headers) {
  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwardedFor ?? headers.get('x-real-ip') ?? 'unknown';
  const userAgent = headers.get('user-agent') ?? 'unknown';

  return createHash('sha256').update(`${address}|${userAgent}`).digest('hex');
}

/** Public QR page may show Current|After when printable Current + After exist. */
export function getPublicImagery(recipient: PublicRecipient) {
  const printable =
    recipient.current_image_url &&
    (recipient.current_image_source === 'crew_photo' ||
      recipient.current_image_source === 'owner_upload')
      ? recipient.current_image_url
      : null;
  const after = recipient.after_image_url;
  const approved = recipient.review_status === 'approved';

  if (printable && after) {
    return {
      currentUrl: printable,
      afterUrl: after,
      approved,
      legacyOnly: null as string | null,
    };
  }

  // Legacy single concept image fallback
  return {
    currentUrl: null as string | null,
    afterUrl: null as string | null,
    approved: false,
    legacyOnly: recipient.concept_image_url,
  };
}
