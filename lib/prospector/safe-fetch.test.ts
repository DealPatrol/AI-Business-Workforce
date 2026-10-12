import assert from 'node:assert/strict';
import http from 'node:http';
import { describe, it } from 'node:test';
import { PublicFetchError } from '@/lib/prospector/errors';
import { assertPublicUrl, isPrivateIp, pinnedLookup, resolvePublicAddress } from '@/lib/prospector/safe-fetch';

describe('isPrivateIp', () => {
  const blocked = [
    '0.0.0.0', '0.1.2.3', '10.0.0.1', '127.0.0.1', '127.255.255.254', '169.254.169.254', '169.254.0.1',
    '172.16.0.1', '172.31.255.255', '192.168.1.1', '100.64.0.1', '100.127.255.255', '224.0.0.1',
    '255.255.255.255', '192.0.2.1', '198.18.0.1',
    '::', '::1', '0:0:0:0:0:0:0:1', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'fe80::1%eth0', 'febf::1',
    'fec0::1', 'ff02::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '::FFFF:169.254.169.254', '::ffff:10.0.0.1',
    '::127.0.0.1', '64:ff9b::127.0.0.1', '64:ff9b::a9fe:a9fe', '64:ff9b:1::1', '2002:7f00:1::',
    '2002:a9fe:a9fe::1', '2001:0::1', '2001:db8::1', '100::1', '[::1]', 'not-an-ip', '',
  ];
  for (const ip of blocked) it(`blocks ${ip || '(empty)'}`, () => assert.equal(isPrivateIp(ip), true));

  const allowed = ['8.8.8.8', '1.1.1.1', '172.32.0.1', '100.128.0.1', '2606:4700:4700::1111',
    '2001:4860:4860::8888', '::ffff:8.8.8.8', '64:ff9b::8.8.8.8', '2002:0808:0808::1'];
  for (const ip of allowed) it(`allows ${ip}`, () => assert.equal(isPrivateIp(ip), false));
});

describe('assertPublicUrl', () => {
  for (const url of ['http://[::1]/', 'http://[::ffff:127.0.0.1]/', 'http://169.254.169.254/latest',
    'http://0x7f.1/', 'http://2130706433/', 'http://localhost/', 'http://[fd00::1]/', 'ftp://example.com/']) {
    it(`rejects ${url}`, () => assert.throws(() => assertPublicUrl(url), PublicFetchError));
  }
  it('accepts a normal site', () => assert.equal(assertPublicUrl('https://example.com/x#y').toString(), 'https://example.com/x'));
});

describe('resolvePublicAddress', () => {
  it('rejects when any record is private (rebinding mix)', async () => {
    await assert.rejects(
      resolvePublicAddress('evil.test', async () => [
        { address: '93.184.216.34', family: 4 },
        { address: '127.0.0.1', family: 4 },
      ]),
      PublicFetchError,
    );
  });
  it('rejects mapped/NAT64 metadata addresses', async () => {
    await assert.rejects(resolvePublicAddress('x.test', async () => [{ address: '::ffff:169.254.169.254', family: 6 }]));
    await assert.rejects(resolvePublicAddress('x.test', async () => [{ address: '64:ff9b::a9fe:a9fe', family: 6 }]));
  });
  it('resolves only once and returns the vetted address', async () => {
    let calls = 0;
    const res = await resolvePublicAddress('ok.test', async () => {
      calls += 1;
      return [{ address: '93.184.216.34', family: 4 }];
    });
    assert.deepEqual(res, { address: '93.184.216.34', family: 4 });
    assert.equal(calls, 1);
  });
  it('rejects private IP literals without DNS', async () => {
    await assert.rejects(resolvePublicAddress('[::1]', async () => { throw new Error('no dns'); }), PublicFetchError);
  });
});

describe('pinnedLookup', () => {
  it('always returns the pinned address regardless of hostname', async () => {
    const lookup = pinnedLookup('93.184.216.34', 4);
    const single = await new Promise((resolve) =>
      (lookup as any)('rebind.test', {}, (_e: unknown, a: string, f: number) => resolve([a, f])));
    assert.deepEqual(single, ['93.184.216.34', 4]);
    const all = await new Promise((resolve) =>
      (lookup as any)('rebind.test', { all: true }, (_e: unknown, a: unknown) => resolve(a)));
    assert.deepEqual(all, [{ address: '93.184.216.34', family: 4 }]);
  });
  it('errors if the pinned address is private', async () => {
    const err = await new Promise((resolve) => (pinnedLookup('127.0.0.1', 4) as any)('x', {}, (e: unknown) => resolve(e)));
    assert.ok(err instanceof PublicFetchError);
  });
  it('the socket connects to the pinned address, not live DNS', async () => {
    const server = http.createServer((_req, res) => res.end('pinned-ok'));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    const port = (server.address() as { port: number }).port;
    // Bypass the private check only for this local test by pinning via a raw lookup wrapper.
    const body = await new Promise<string>((resolve, reject) => {
      http
        .get(
          { host: 'does-not-exist.invalid', port, path: '/', agent: false,
            lookup: ((_h: string, o: any, cb: any) => (o?.all ? cb(null, [{ address: '127.0.0.1', family: 4 }]) : cb(null, '127.0.0.1', 4))) as any },
          (res) => { let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => resolve(d)); },
        )
        .on('error', reject);
    });
    server.close();
    assert.equal(body, 'pinned-ok');
  });
});
