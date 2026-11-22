import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  HOT_LEADS_500_VALUE,
  HOT_LEADS_CURRENCY,
  trackHotLeadsInitiateCheckout,
  trackHotLeadsPurchase,
} from '@/lib/analytics/hot-leads-events';

type FbqCall = unknown[];

function installBrowser(options?: { pixelOn?: boolean; storage?: boolean }) {
  const calls: FbqCall[] = [];
  const store = new Map<string, string>();
  const pixelOn = options?.pixelOn !== false;
  const allowStorage = options?.storage !== false;

  const document = {
    documentElement: {
      dataset: pixelOn ? { metaPixel: 'on' } : {},
    },
  };

  const sessionStorage = allowStorage
    ? {
        getItem(key: string) {
          return store.has(key) ? store.get(key)! : null;
        },
        setItem(key: string, value: string) {
          store.set(key, value);
        },
      }
    : {
        getItem() {
          throw new Error('blocked');
        },
        setItem() {
          throw new Error('blocked');
        },
      };

  const fbq = (...args: unknown[]) => {
    calls.push(args);
  };

  const previous = {
    window: (globalThis as { window?: unknown }).window,
    document: (globalThis as { document?: unknown }).document,
  };

  (globalThis as { window?: unknown }).window = { fbq, sessionStorage };
  (globalThis as { document?: unknown }).document = document;

  return {
    calls,
    restore() {
      if (previous.window === undefined) delete (globalThis as { window?: unknown }).window;
      else (globalThis as { window?: unknown }).window = previous.window;
      if (previous.document === undefined) delete (globalThis as { document?: unknown }).document;
      else (globalThis as { document?: unknown }).document = previous.document;
    },
  };
}

describe('hot leads Meta pixel events', () => {
  let restore: () => void = () => undefined;

  afterEach(() => {
    restore();
  });

  it('fires InitiateCheckout with the $20 USD value and does not require an event id', () => {
    const browser = installBrowser();
    restore = browser.restore;
    trackHotLeadsInitiateCheckout();
    assert.deepEqual(browser.calls, [
      ['track', 'InitiateCheckout', { value: HOT_LEADS_500_VALUE, currency: HOT_LEADS_CURRENCY }],
    ]);
  });

  it('fires Purchase once per checkout session with value, currency, and a stable event id', () => {
    const browser = installBrowser();
    restore = browser.restore;
    const sessionId = 'cs_live_abc123';
    const first = trackHotLeadsPurchase(sessionId);
    const second = trackHotLeadsPurchase(sessionId);
    assert.equal(first, 'purchase-cs_live_abc123');
    assert.equal(second, 'purchase-cs_live_abc123');
    assert.deepEqual(browser.calls, [
      [
        'track',
        'Purchase',
        { value: HOT_LEADS_500_VALUE, currency: HOT_LEADS_CURRENCY },
        { eventID: 'purchase-cs_live_abc123' },
      ],
    ]);
  });

  it('does not fire Purchase without a session id, and skips when the pixel is off', () => {
    const noSession = installBrowser();
    restore = noSession.restore;
    assert.equal(trackHotLeadsPurchase(''), '');
    assert.deepEqual(noSession.calls, []);
    noSession.restore();

    const pixelOff = installBrowser({ pixelOn: false });
    restore = pixelOff.restore;
    trackHotLeadsInitiateCheckout();
    trackHotLeadsPurchase('cs_live_abc123');
    assert.deepEqual(pixelOff.calls, []);
  });
});
