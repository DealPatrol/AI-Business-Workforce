import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { afterEach, describe, it } from 'node:test';
import {
  PILOT_SALE_LINK_SECRET_ENV,
  PILOT_SALE_LINK_TTL_SECONDS,
  pilotSaleLinkUrl,
  signPilotSaleToken,
  verifyPilotSaleToken,
} from '@/lib/ava/pilot-sale-link';
import { pilotBookedJobBlock } from '@/lib/ava/pilot-sale-email';

const SECRET = 'test-sale-link-secret';
const LEAD = '3f8c1c1e-6a52-4c61-9a52-0d3f5b9a7c11';
const OTHER_LEAD = '9b2d4e55-1f0c-4a2e-8c33-7a6f1d2e9b44';
const NOW = 1_800_000_000;

describe('pilot sale link signature', () => {
  it('round-trips a lead id', () => {
    const token = signPilotSaleToken({ leadId: LEAD, secret: SECRET, nowSeconds: NOW });
    assert.deepEqual(verifyPilotSaleToken({ token, secret: SECRET, nowSeconds: NOW + 60 }), {
      ok: true,
      leadId: LEAD,
    });
  });

  it('rejects a wrong secret and a missing secret', () => {
    const token = signPilotSaleToken({ leadId: LEAD, secret: SECRET, nowSeconds: NOW });
    assert.deepEqual(verifyPilotSaleToken({ token, secret: 'other', nowSeconds: NOW }), {
      ok: false,
      reason: 'bad_signature',
    });
    assert.deepEqual(verifyPilotSaleToken({ token, secret: '', nowSeconds: NOW }), { ok: false, reason: 'no_secret' });
    assert.throws(() => signPilotSaleToken({ leadId: LEAD, secret: '' }), /AVA_SALE_LINK_SECRET/);
  });

  it('rejects a payload swapped to another lead while keeping the old signature', () => {
    const real = signPilotSaleToken({ leadId: LEAD, secret: SECRET, nowSeconds: NOW });
    const forged = signPilotSaleToken({ leadId: OTHER_LEAD, secret: 'attacker', nowSeconds: NOW });
    const [, , realSig] = real.split('.');
    const [version, forgedBody] = forged.split('.');
    const spliced = `${version}.${forgedBody}.${realSig}`;
    assert.deepEqual(verifyPilotSaleToken({ token: spliced, secret: SECRET, nowSeconds: NOW }), {
      ok: false,
      reason: 'bad_signature',
    });
  });

  it('rejects a flipped signature byte and malformed tokens', () => {
    const token = signPilotSaleToken({ leadId: LEAD, secret: SECRET, nowSeconds: NOW });
    const tampered = token.slice(0, -2) + (token.endsWith('AA') ? 'BB' : 'AA');
    assert.equal(verifyPilotSaleToken({ token: tampered, secret: SECRET, nowSeconds: NOW }).ok, false);
    for (const bad of ['', 'abc', 'v1.a', 'v2.a.b', 'v1..', `${token}.extra`]) {
      assert.equal(verifyPilotSaleToken({ token: bad, secret: SECRET, nowSeconds: NOW }).ok, false, bad);
    }
  });

  it('expires after the ttl and rejects future-dated tokens', () => {
    const token = signPilotSaleToken({ leadId: LEAD, secret: SECRET, nowSeconds: NOW });
    assert.equal(verifyPilotSaleToken({ token, secret: SECRET, nowSeconds: NOW + PILOT_SALE_LINK_TTL_SECONDS }).ok, true);
    assert.deepEqual(
      verifyPilotSaleToken({ token, secret: SECRET, nowSeconds: NOW + PILOT_SALE_LINK_TTL_SECONDS + 1 }),
      { ok: false, reason: 'expired' },
    );
    assert.deepEqual(verifyPilotSaleToken({ token, secret: SECRET, nowSeconds: NOW - 3600 }), {
      ok: false,
      reason: 'expired',
    });
  });

  it('rejects a token signed for another purpose (destination-edit style) even with the same secret', () => {
    const body = Buffer.from(JSON.stringify({ p: 'ava-notify-destination', lid: LEAD, iat: NOW, exp: NOW + 100 })).toString('base64url');
    // sign it properly so only the purpose check can reject it
    const sig = createHmac('sha256', SECRET).update(body, 'utf8').digest().toString('base64url');
    assert.deepEqual(verifyPilotSaleToken({ token: `v1.${body}.${sig}`, secret: SECRET, nowSeconds: NOW }), {
      ok: false,
      reason: 'wrong_purpose',
    });
  });

  it('builds a GET confirmation URL on /api/ava/sales/booked', () => {
    const url = new URL(pilotSaleLinkUrl('https://app.example.test', 'v1.a.b'));
    assert.equal(url.pathname, '/api/ava/sales/booked');
    assert.equal(url.searchParams.get('t'), 'v1.a.b');
  });
});

describe('pilot lead email block', () => {
  const original = process.env[PILOT_SALE_LINK_SECRET_ENV];
  afterEach(() => {
    if (original === undefined) delete process.env[PILOT_SALE_LINK_SECRET_ENV];
    else process.env[PILOT_SALE_LINK_SECRET_ENV] = original;
  });

  it('adds a signed link for pilot plans only', () => {
    process.env[PILOT_SALE_LINK_SECRET_ENV] = SECRET;
    const block = pilotBookedJobBlock({ plan: 'pilot_97', leadId: LEAD, baseUrl: 'https://app.example.test' });
    assert.match(block, /Mark as booked job/);
    const href = /href="([^"]+)"/.exec(block)?.[1] ?? '';
    const token = new URL(href.replaceAll('&amp;', '&')).searchParams.get('t') ?? '';
    assert.deepEqual(verifyPilotSaleToken({ token, secret: SECRET }), { ok: true, leadId: LEAD });
    for (const plan of ['starter', 'growth', 'pro', null, undefined, '']) {
      assert.equal(pilotBookedJobBlock({ plan, leadId: LEAD, baseUrl: 'https://app.example.test' }), '', String(plan));
    }
  });

  it('omits the link (does not throw) when the secret is not configured', () => {
    delete process.env[PILOT_SALE_LINK_SECRET_ENV];
    const silence = console.error;
    console.error = () => {};
    try {
      assert.equal(pilotBookedJobBlock({ plan: 'pilot_147', leadId: LEAD }), '');
    } finally {
      console.error = silence;
    }
  });
});
