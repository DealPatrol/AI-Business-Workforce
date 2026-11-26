/** Driveway cleaning estimate: sq ft x rate, rounded, with an optional floor. */

export type PriceConfig = {
  /** Dollars per square foot. Default 0.30. */
  ratePerSqft: number;
  /** Lowest price printed on a card. Default 0 (no floor). */
  minimumPrice: number;
  /** Round to the nearest N dollars. Default 5. */
  roundTo: number;
};

export const DEFAULT_PRICE_CONFIG: PriceConfig = { ratePerSqft: 0.3, minimumPrice: 0, roundTo: 5 };

export function parsePriceConfig(input: Partial<Record<keyof PriceConfig, unknown>> | null | undefined): PriceConfig {
  const num = (v: unknown, fallback: number, min: number, max: number) => {
    const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
    return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
  };
  return {
    ratePerSqft: num(input?.ratePerSqft, DEFAULT_PRICE_CONFIG.ratePerSqft, 0.01, 5),
    minimumPrice: num(input?.minimumPrice, DEFAULT_PRICE_CONFIG.minimumPrice, 0, 5000),
    roundTo: num(input?.roundTo, DEFAULT_PRICE_CONFIG.roundTo, 1, 100),
  };
}

export function estimatePrice(sqft: number, config: PriceConfig = DEFAULT_PRICE_CONFIG): number {
  if (!Number.isFinite(sqft) || sqft <= 0) return config.minimumPrice;
  const raw = sqft * config.ratePerSqft;
  const rounded = Math.round(raw / config.roundTo) * config.roundTo;
  return Math.max(config.minimumPrice, rounded);
}

export function formatPrice(dollars: number): string {
  return `$${dollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}
