import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCanSpamFooter, evaluateSend, formatFromHeader, isSuppressed } from '@/lib/prospector/gates';
import { signUnsubscribeToken, verifyUnsubscribeToken } from '@/lib/prospector/unsubscribe-token';

const SECRET = 'test-unsubscribe-secret';
const ADDRESS = '100 Congress Ave, Austin, TX 78701';

function ready(overrides: Partial<Parameters<typeof evaluateSend>[0]> = {}) {
  return evaluateSend({
    approved: true,
    toEmail: 'Owner@OakLawnFuneral.com',
    subject: 'A note for Oak Lawn',
    body: 'We help funeral homes show families monument options.',
    suppressedEmails: [],
    sentToday: 0,
    dailyCap: 25,
    lastSentAtMs: null,
    nowMs: 1_700_000_000_000,
    spacingSeconds: 90,
    mailingAddress: ADDRESS,
    senderName: 'Cole',
    senderEmail: 'cole@yardmail.test',
    ...overrides,
  });
}

describe('suppression and send gate', () => {
  it('matches suppression addresses case-insensitively', () => {
    assert.equal(isSuppressed(' Owner@Shop.com ', ['owner@shop.com']), true);
    assert.equal(isSuppressed('other@shop.com', ['owner@shop.com']), false);
  });

  it('blocks unapproved, suppressed, over-cap, and too-soon sends', () => {
    const unapproved = ready({ approved: false });
    assert.equal(unapproved.ok, false);
    if (!unapproved.ok) assert.equal(unapproved.code, 'not_approved');

    const suppressed = ready({ suppressedEmails: ['owner@oaklawnfuneral.com'] });
    assert.equal(suppressed.ok, false);
    if (!suppressed.ok) assert.equal(suppressed.code, 'suppressed');

    const capped = ready({ sentToday: 25, dailyCap: 25 });
    assert.equal(capped.ok, false);
    if (!capped.ok) assert.equal(capped.code, 'daily_cap');

    const spaced = ready({ lastSentAtMs: 1_700_000_000_000 - 10_000, spacingSeconds: 90 });
    assert.equal(spaced.ok, false);
    if (!spaced.ok) {
      assert.equal(spaced.code, 'spacing');
      assert.equal(spaced.retryAfterSeconds, 80);
    }
  });

  it('requires the sender identity and a physical mailing address from settings', () => {
    const missingAddress = ready({ mailingAddress: '' });
    assert.equal(missingAddress.ok, false);
    if (!missingAddress.ok) assert.equal(missingAddress.code, 'missing_address');

    const missingSender = ready({ senderEmail: '' });
    assert.equal(missingSender.ok, false);
    if (!missingSender.ok) assert.equal(missingSender.code, 'missing_sender');

    const allowed = ready({ sentToday: 24, lastSentAtMs: 1_700_000_000_000 - 90_000 });
    assert.equal(allowed.ok, true);
    if (allowed.ok) {
      assert.equal(allowed.toEmail, 'owner@oaklawnfuneral.com');
      assert.equal(allowed.fromHeader, 'Cole <cole@yardmail.test>');
      assert.equal(allowed.subject, 'A note for Oak Lawn');
    }
  });

  it('builds a CAN-SPAM footer from the provided address and strips header injection', () => {
    const url = 'https://ai-business-workforce.vercel.app/prospector/unsubscribe?token=abc';
    const footer = buildCanSpamFooter({
      senderName: 'Cole',
      mailingAddress: ADDRESS,
      unsubscribeUrl: url,
    });
    assert.match(footer, /commercial message from Cole/);
    assert.match(footer, new RegExp(ADDRESS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(footer, /Unsubscribe: https:\/\/ai-business-workforce\.vercel\.app/);
    assert.equal(footer.includes('123 Fake Street'), false);

    assert.throws(() =>
      buildCanSpamFooter({ senderName: 'Cole', mailingAddress: '', unsubscribeUrl: url }),
    );

    const from = formatFromHeader('Cole\r\nBcc: attacker@evil.test', 'cole@yardmail.test');
    assert.equal(from.includes('\n'), false);
    assert.equal(from.includes('\r'), false);
    assert.equal(from, 'Cole Bcc: attacker@evil.test <cole@yardmail.test>');
  });

  it('round-trips an unsubscribe token and rejects tampering', () => {
    const token = signUnsubscribeToken('user-1', ' Owner@Shop.com ', SECRET);
    assert.deepEqual(verifyUnsubscribeToken(token, SECRET), {
      ownerId: 'user-1',
      email: 'owner@shop.com',
    });
    assert.equal(verifyUnsubscribeToken(token, 'other-secret'), null);
    assert.equal(verifyUnsubscribeToken(`${token}x`, SECRET), null);
    assert.equal(verifyUnsubscribeToken('not-a-token', SECRET), null);
  });
});
