import { createRateLimiter } from '@/lib/rate-limit';

export const takePostcardSetupLookup = createRateLimiter(30, 10 * 60 * 1000);
