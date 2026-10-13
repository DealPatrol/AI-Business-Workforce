import { createRateLimiter } from '@/lib/rate-limit';

export const takeAgentTurn = createRateLimiter(8, 10 * 60 * 1000);
