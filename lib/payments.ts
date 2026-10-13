export const FOUNDING_CTA = 'Start for $389 + $129/month';

/** Checkout for the YardMailer founding plan: $389 setup and $129/month. */
export function foundingCheckoutHref(cancelPath?: string) {
  if (!cancelPath || cancelPath === '/') return '/api/checkout?offer=founding';
  return `/api/checkout?offer=founding&cancel=${encodeURIComponent(cancelPath)}`;
}

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
          label: 'Buy Demo Blast 10 — $64',
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
