import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractSiteProfile,
  hoursFromSchema,
  hoursFromText,
  phoneFromText,
  profileLinks,
  servicesDraft,
} from '@/lib/ava/onboarding/site-profile';

const html = `<!doctype html><html><head><title>Ridge Plumbing | Gadsden Plumber</title>
<meta name="description" content="Family plumbing in Gadsden.">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Plumber","name":"Ridge Plumbing &amp; Drain","telephone":"+1-256-555-0101","address":{"streetAddress":"1 Main St","addressLocality":"Gadsden","addressRegion":"AL","postalCode":"35901"},"areaServed":["Gadsden","Rainbow City"],"openingHoursSpecification":[{"dayOfWeek":["Monday","Tuesday"],"opens":"08:00","closes":"17:00"}]},{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Do you charge a trip fee?","acceptedAnswer":{"@type":"Answer","text":"Yes, $89, waived if you book the repair."}}]}]}</script>
</head><body><h2>Water Heater Repair</h2><h2>Drain Cleaning</h2><h2>Contact Us</h2><h3>Why do pipes burst?</h3>
<a href="/services/">Services</a><a href="https://other.com/about">x</a><a href="/about-us">About</a>
<details><summary>Are you licensed?</summary><p>Yes, Alabama licensed.</p></details></body></html>`;

describe('site profile', () => {
  it('reads JSON-LD business facts, hours, FAQs, and services', () => {
    const p = extractSiteProfile(html, 'https://ridge.example/');
    assert.equal(p.businessName, 'Ridge Plumbing & Drain');
    assert.equal(p.phone, '+1-256-555-0101');
    assert.equal(p.address, '1 Main St, Gadsden, AL 35901');
    assert.equal(p.serviceArea, 'Gadsden, Rainbow City');
    assert.equal(p.hours, 'Mon, Tue 8am–5pm');
    assert.deepEqual(p.services, ['Water Heater Repair', 'Drain Cleaning']);
    assert.equal(p.faqs.length, 2);
    assert.match(servicesDraft(p), /Q: Do you charge a trip fee\?/);
  });

  it('falls back to page text for hours and phone', () => {
    assert.equal(hoursFromText('Hours: Monday - Friday 7:00 AM - 5:00 PM'), 'Monday - Friday 7:00 AM - 5:00 PM');
    assert.equal(phoneFromText('Call (256) 555-0199 today'), '(256) 555-0199');
    assert.equal(hoursFromSchema({ openingHours: 'Mo-Fr 07:30-16:00' }), 'Mon–Fri 7:30am–4pm');
  });

  it('only follows same-site profile links', () => {
    assert.deepEqual(profileLinks(html, 'https://ridge.example/'), ['https://ridge.example/services/', 'https://ridge.example/about-us']);
  });
});
