import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CHECKOUT_GET_REDIRECT_PATH, isKnownCrawlerUserAgent } from '@/lib/checkout-guard';
import {
  EXECUTIVE_RECEPTIONIST_ORIGIN,
  EXECUTIVE_RECEPTIONIST_WWW_REDIRECT_STATUS,
  executiveReceptionistWwwRedirectUrl,
} from '@/lib/site-url';

describe('checkout bot guard', () => {
  it('sends GET checkout to pricing and does not treat a browser as a crawler', () => {
    assert.equal(CHECKOUT_GET_REDIRECT_PATH, '/pricing');
    assert.equal(
      isKnownCrawlerUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'),
      false,
    );
    assert.equal(isKnownCrawlerUserAgent(''), false);
    assert.equal(isKnownCrawlerUserAgent(null), false);
  });

  it('rejects known link crawlers', () => {
    assert.equal(isKnownCrawlerUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true);
    assert.equal(isKnownCrawlerUserAgent('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'), true);
    assert.equal(isKnownCrawlerUserAgent('facebookexternalhit/1.1'), true);
    assert.equal(isKnownCrawlerUserAgent('Slackbot-LinkExpanding 1.0'), true);
  });
});

describe('executive receptionist www redirect', () => {
  it('301s www to the apex and leaves the apex alone', () => {
    const www = executiveReceptionistWwwRedirectUrl(
      'www.executivereceptionist.com',
      new URL('http://www.executivereceptionist.com/receptionist?plan=growth'),
    );
    assert.ok(www);
    assert.equal(www.toString(), `${EXECUTIVE_RECEPTIONIST_ORIGIN}/receptionist?plan=growth`);
    assert.equal(EXECUTIVE_RECEPTIONIST_WWW_REDIRECT_STATUS, 301);
    assert.equal(
      executiveReceptionistWwwRedirectUrl('executivereceptionist.com', new URL('https://executivereceptionist.com/')),
      null,
    );
    assert.equal(
      executiveReceptionistWwwRedirectUrl('frontporchgrowth.com', new URL('https://frontporchgrowth.com/')),
      null,
    );
  });
});
