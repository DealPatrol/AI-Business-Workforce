import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRateLimiter } from '@/lib/rate-limit';

describe('rate limiter', () => {
  it('allows the limit and then asks the caller to wait', () => {
    const take = createRateLimiter(2, 10_000);
    assert.equal(take('a', 1_000).ok, true);
    assert.equal(take('a', 1_100).ok, true);
    const blocked = take('a', 1_200);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.ok(blocked.retryAfterSeconds >= 1);
    assert.equal(take('b', 1_200).ok, true);
  });
});
