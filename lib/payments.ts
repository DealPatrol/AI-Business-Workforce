export const FOUNDING_PAYMENT_LINK = 'https://buy.stripe.com/eVq8wR3Zk9kx9Gh0PO0Ba01';

const DEMO10_CONTACT_EMAIL = 'colecollins763@gmail.com';

export type Demo10Payment = {
  href: string;
  label: string;
  configured: boolean;
};

export function getDemo10Payment(): Demo10Payment {
  const configuredLink = process.env.DEMO10_PAYMENT_LINK?.trim();
  if (configuredLink) {
    try {
      const url = new URL(configuredLink);
      if (url.protocol === 'https:') {
        return {
          href: url.toString(),
          label: 'Buy Demo Blast 10 — $49',
          configured: true,
        };
      }
    } catch {
      // Invalid values intentionally fall through to the honest contact path.
    }
  }

  return {
    href: `mailto:${DEMO10_CONTACT_EMAIL}?subject=${encodeURIComponent('Request Demo Blast 10')}`,
    label: 'Request Demo Blast 10',
    configured: false,
  };
}
