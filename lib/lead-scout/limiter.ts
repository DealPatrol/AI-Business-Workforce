import { createRateLimiter } from '@/lib/rate-limit';

export const takeLeadScoutSearch = createRateLimiter(6, 10 * 60 * 1000);
