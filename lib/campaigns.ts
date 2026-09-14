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
