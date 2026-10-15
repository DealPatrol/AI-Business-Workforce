export type RateLimitDecision = { ok: true } | { ok: false; retryAfterSeconds: number };

export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();

  return function take(key: string, now = Date.now()): RateLimitDecision {
    const cutoff = now - windowMs;
    const recent = (hits.get(key) || []).filter((stamp) => stamp > cutoff);
    if (recent.length >= limit) {
      hits.set(key, recent);
      const retryAfterSeconds = Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
      return { ok: false, retryAfterSeconds };
    }
    recent.push(now);
    hits.set(key, recent);
    return { ok: true };
  };
}
