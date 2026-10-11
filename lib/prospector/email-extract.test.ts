import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  decodeCloudflareEmail,
  extractContactNames,
  extractEmails,
  isJunkEmail,
  pickContactLinks,
} from '@/lib/prospector/email-extract';

function encodeCloudflare(email: string, key = 0x2a): string {
  let hex = key.toString(16).padStart(2, '0');
  for (const character of email) {
    hex += (character.charCodeAt(0) ^ key).toString(16).padStart(2, '0');
  }
  return hex;
}

describe('email extraction', () => {
  it('reads mailto links, plain text, and HTML entities, and drops junk', () => {
    const html = `
      <a href="mailto:Owner@OakLawnFuneral.com?subject=Hello">Email</a>
      <p>Reach Maria at maria&#64;oaklawnfuneral.com or hello&amp;more owner@oaklawnfuneral.com</p>
      <p>noreply@oaklawnfuneral.com</p>
      <p>user@example.com</p>
      <img src="logo@2x.png">
      <p>alerts@o451.ingest.sentry.io</p>
      <a href="mailto:jobs@wixpress.com">wix</a>
    `;
    const emails = extractEmails(html);
    assert.deepEqual(emails.sort(), ['maria@oaklawnfuneral.com', 'owner@oaklawnfuneral.com']);
  });

  it('decodes Cloudflare email protection', () => {
    const email = 'sam.patel@monumentco.com';
    const html = `<a href="/cdn-cgi/l/email-protection" data-cfemail="${encodeCloudflare(email)}">email</a>`;
    assert.equal(decodeCloudflareEmail(encodeCloudflare(email)), email);
    assert.deepEqual(extractEmails(html), [email]);
  });

  it('rejects obvious junk addresses', () => {
    for (const email of [
      'noreply@shop.com',
      'name@example.com',
      'logo@2x.png',
      'person@yoursite.com',
      'not an email',
      'a@b',
    ]) {
      assert.equal(isJunkEmail(email), true, email);
    }
    assert.equal(isJunkEmail('owner@shop.com'), false);
  });

  it('finds owner and manager names without treating labels as names', () => {
    const html = `
      <h1>About</h1>
      <p>Owner: Maria Lopez</p>
      <p>Managed by Sam Patel</p>
      <p>Ana Ruiz, General Manager</p>
      <p>Contact us for pricing.</p>
    `;
    assert.deepEqual(extractContactNames(html), ['Maria Lopez', 'Sam Patel', 'Ana Ruiz']);
  });

  it('prefers same-site contact and about links', () => {
    const html = `
      <a href="/pricing">Pricing</a>
      <a href="https://other.example/contact">External</a>
      <a href="/about-us">About</a>
      <a href="/contact">Contact</a>
      <a href="mailto:owner@oaklawnfuneral.com">Mail</a>
    `;
    assert.deepEqual(pickContactLinks(html, 'https://www.oaklawnfuneral.com/'), [
      'https://www.oaklawnfuneral.com/contact',
      'https://www.oaklawnfuneral.com/about-us',
    ]);
  });
});
