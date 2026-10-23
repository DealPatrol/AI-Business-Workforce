const CRAWLER_TOKENS = [
  'googlebot',
  'adsbot-google',
  'mediapartners-google',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'telegrambot',
  'applebot',
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'petalbot',
  'bytespider',
  'gptbot',
  'claudebot',
  'amazonbot',
  'ccbot',
  'ia_archiver',
  'spider',
  'crawler',
] as const;

/** GET /api/checkout must never create a Stripe session. Browsers land on pricing. */
export const CHECKOUT_GET_REDIRECT_PATH = '/pricing';

export function isKnownCrawlerUserAgent(userAgent: string | null | undefined) {
  const ua = (userAgent || '').toLowerCase();
  if (!ua) return false;
  return CRAWLER_TOKENS.some((token) => ua.includes(token));
}
