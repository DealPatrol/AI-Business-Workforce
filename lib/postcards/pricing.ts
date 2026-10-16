/**
 * YardMailer postcard prices.
 * Per-card amounts are 3× the Thanks.io supplier cost and include postage, printing, and mailing.
 * The setup fee is charged once per customer.
 */

export const POSTCARD_SETUP_CENTS = 12700;
export const POSTCARD_SETUP_LABEL = '$127';
export const POSTCARD_MIN_QUANTITY = 100;
export const POSTCARD_MAX_QUANTITY = 10000;
export const POSTCARD_CTA = 'Order postcards';
export const POSTCARD_PACKAGES_HREF = '/postcards#packages';

export const POSTCARD_PRICE_SUMMARY =
  '$127 one-time setup, charged once per customer, plus $3.54 per 4×6 card or $4.95 per 6×9 card. Postage, printing, and mailing included.';

export const POSTCARD_FULFILLMENT_COPY =
  "AI designs the card, then it's printed and mailed directly to the homeowners.";

export const POSTCARD_SIZES = {
  '4x6': {
    id: '4x6',
    label: '4×6',
    unitCents: 354,
    unitLabel: '$3.54',
    productName: 'YardMailer 4×6 postcard',
  },
  '6x9': {
    id: '6x9',
    label: '6×9',
    unitCents: 495,
    unitLabel: '$4.95',
    productName: 'YardMailer 6×9 postcard',
  },
} as const;

export type PostcardSize = keyof typeof POSTCARD_SIZES;

export const POSTCARD_SIZE_KEYS = Object.keys(POSTCARD_SIZES) as PostcardSize[];

export const POSTCARD_PACKAGE_QUANTITIES = [100, 250, 500] as const;

export type PostcardPackageQuantity = (typeof POSTCARD_PACKAGE_QUANTITIES)[number];

export function isPostcardSize(value: string): value is PostcardSize {
  return value === '4x6' || value === '6x9';
}

export function formatPostcardMoney(cents: number): string {
  const negative = cents < 0;
  const absolute = Math.abs(Math.trunc(cents));
  const dollars = Math.floor(absolute / 100);
  const remainder = absolute % 100;
  const grouped = dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const body = remainder === 0 ? grouped : `${grouped}.${remainder.toString().padStart(2, '0')}`;
  // One currency sign + amount (avoid $${ in templates; that greps like a double dollar).
  return (negative ? '-' : '') + '$' + body;
}

export function postcardOrderCents(
  size: PostcardSize,
  quantity: number,
  options?: { includeSetup?: boolean },
) {
  const unitCents = POSTCARD_SIZES[size].unitCents;
  const cardsCents = unitCents * quantity;
  const setupCents = options?.includeSetup === false ? 0 : POSTCARD_SETUP_CENTS;
  return {
    setupCents,
    unitCents,
    cardsCents,
    totalCents: setupCents + cardsCents,
  };
}

export function parsePostcardQuantity(value: unknown): number | null {
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) return null;
    if (value < POSTCARD_MIN_QUANTITY || value > POSTCARD_MAX_QUANTITY) return null;
    return value;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{1,6}$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < POSTCARD_MIN_QUANTITY || parsed > POSTCARD_MAX_QUANTITY) return null;
  return parsed;
}

export function postcardCheckoutHref(input: {
  size: PostcardSize;
  quantity: number;
  cancelPath?: string;
}) {
  const params = new URLSearchParams();
  params.set('offer', 'postcard');
  params.set('size', input.size);
  params.set('quantity', String(input.quantity));
  if (input.cancelPath && input.cancelPath !== '/') {
    params.set('cancel', input.cancelPath);
  }
  return `/api/checkout?${params.toString()}`;
}

export function postcardPackageRows() {
  return POSTCARD_PACKAGE_QUANTITIES.map((quantity) => {
    const four = postcardOrderCents('4x6', quantity);
    const six = postcardOrderCents('6x9', quantity);
    return {
      quantity,
      fourBySixCents: four.totalCents,
      sixByNineCents: six.totalCents,
      fourBySixLabel: formatPostcardMoney(four.totalCents),
      sixByNineLabel: formatPostcardMoney(six.totalCents),
    };
  });
}

export function postcardPublicOffers(url: string) {
  const setup = {
    '@type': 'Offer',
    name: 'YardMailer setup',
    url,
    price: (POSTCARD_SETUP_CENTS / 100).toFixed(2),
    priceCurrency: 'USD',
    description: '$127 one-time setup fee, charged once per customer.',
  };
  const perCard = POSTCARD_SIZE_KEYS.map((size) => {
    const card = POSTCARD_SIZES[size];
    return {
      '@type': 'Offer',
      name: card.productName,
      url,
      price: (card.unitCents / 100).toFixed(2),
      priceCurrency: 'USD',
      description: `${card.unitLabel} per ${card.label} card. Postage, printing, and mailing included. Minimum ${POSTCARD_MIN_QUANTITY} cards.`,
    };
  });
  const packages = postcardPackageRows().flatMap((row) => [
    {
      '@type': 'Offer',
      name: `YardMailer ${row.quantity} 4×6 postcards`,
      url,
      price: (row.fourBySixCents / 100).toFixed(2),
      priceCurrency: 'USD',
      description: `${row.quantity} 4×6 cards plus the $127 setup fee, charged once per customer.`,
    },
    {
      '@type': 'Offer',
      name: `YardMailer ${row.quantity} 6×9 postcards`,
      url,
      price: (row.sixByNineCents / 100).toFixed(2),
      priceCurrency: 'USD',
      description: `${row.quantity} 6×9 cards plus the $127 setup fee, charged once per customer.`,
    },
  ]);
  return [setup, ...perCard, ...packages];
}
