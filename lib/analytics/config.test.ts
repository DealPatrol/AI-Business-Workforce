import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  adsSendTo,
  readGa4Id,
  readGoogleAdsCheckoutLabel,
  readGoogleAdsId,
  readMetaPixelId,
} from '@/lib/analytics/config';

describe('ad tracking env ids', () => {
  const keys = [
    'NEXT_PUBLIC_GOOGLE_ADS_ID',
    'NEXT_PUBLIC_GA4_ID',
    'META_PIXEL_ID',
    'NEXT_PUBLIC_META_PIXEL_ID',
    'NEXT_PUBLIC_GOOGLE_ADS_CHECKOUT_LABEL',
  ] as const;
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  afterEach(() => {
    for (const key of keys) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  function clearAll() {
    for (const key of keys) delete process.env[key];
  }

  it('returns empty strings when ids are unset or invalid, so tags do not load', () => {
    clearAll();
    assert.equal(readGoogleAdsId(), '');
    assert.equal(readGa4Id(), '');
    assert.equal(readMetaPixelId(), '');
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = 'not-a-tag';
    process.env.NEXT_PUBLIC_GA4_ID = 'UA-12345';
    process.env.META_PIXEL_ID = 'pix_abc';
    assert.equal(readGoogleAdsId(), '');
    assert.equal(readGa4Id(), '');
    assert.equal(readMetaPixelId(), '');
  });

  it('accepts a valid Google Ads, GA4, and Meta pixel id', () => {
    clearAll();
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = 'AW-1234567890';
    process.env.NEXT_PUBLIC_GA4_ID = 'G-ABC12DEF34';
    process.env.META_PIXEL_ID = '123456789012345';
    process.env.NEXT_PUBLIC_GOOGLE_ADS_CHECKOUT_LABEL = 'checkoutLabel';
    assert.equal(readGoogleAdsId(), 'AW-1234567890');
    assert.equal(readGa4Id(), 'G-ABC12DEF34');
    assert.equal(readMetaPixelId(), '123456789012345');
    assert.equal(adsSendTo(readGoogleAdsCheckoutLabel()), 'AW-1234567890/checkoutLabel');
  });

  it('falls back to NEXT_PUBLIC_META_PIXEL_ID when META_PIXEL_ID is unset', () => {
    clearAll();
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '9876543210';
    assert.equal(readMetaPixelId(), '9876543210');
  });
});
