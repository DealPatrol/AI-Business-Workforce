import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BUSINESS_FACTS_FAQS, buildBusinessFacts, e164, normalizeUrl, type BusinessFactsInput } from '@/lib/fpg/business-facts';
import { getFpgAeoPage } from '@/lib/fpg/aeo-pages';

const empty: BusinessFactsInput = {
  name: '', schemaType: 'Plumber', website: '', phone: '', street: '', city: '', state: '', zip: '', towns: '', services: '', hours: '', founded: '', license: '', profiles: '',
};

describe('AI business facts generator', () => {
  it('builds matching paragraph, JSON-LD and llms.txt from typed facts', () => {
    const out = buildBusinessFacts({
      ...empty,
      name: 'Porchlight Heating & Air',
      schemaType: 'HVACBusiness',
      website: 'porchlightair.com/',
      phone: '(256) 555-0100',
      city: 'Cullman',
      state: 'AL',
      towns: 'Cullman, Hanceville\nGood Hope',
      services: 'AC repair, furnace repair',
      profiles: 'facebook.com/porchlight',
    });
    assert.equal(out.brief, 'Porchlight Heating & Air is an HVAC company based in Cullman, AL. It offers AC repair and furnace repair. It serves Cullman, Hanceville and Good Hope. Phone: (256) 555-0100.');
    assert.equal(out.jsonLd['@type'], 'HVACBusiness');
    assert.equal(out.jsonLd.url, 'https://porchlightair.com');
    assert.equal(out.jsonLd.telephone, '+12565550100');
    assert.deepEqual(out.jsonLd.sameAs, ['https://facebook.com/porchlight']);
    assert.equal(out.jsonLd.description, out.brief);
    assert.match(out.llms, /^# Porchlight Heating & Air/);
    assert.match(out.llms, /Service area: Cullman, Hanceville, Good Hope/);
    assert.doesNotThrow(() => JSON.parse(out.jsonLdText.replace(/^<script[^>]*>\n|\n<\/script>$/g, '')));
  });

  it('leaves empty facts out of the JSON-LD instead of inventing them', () => {
    const out = buildBusinessFacts(empty);
    for (const key of ['url', 'telephone', 'address', 'areaServed', 'hasOfferCatalog', 'sameAs', 'foundingDate']) {
      assert.equal(key in out.jsonLd, false, key);
    }
    assert.match(out.brief, /\[Business name\]/);
  });

  it('normalizes phone and URLs safely', () => {
    assert.equal(e164('1-205-555-0199'), '+12055550199');
    assert.equal(e164('555-0199'), '');
    assert.equal(normalizeUrl('not a url with spaces'), '');
  });

  it('does not promise AI placement and cites Google on AI text files', () => {
    const text = BUSINESS_FACTS_FAQS.map((f) => `${f.q} ${f.a}`).join('\n');
    assert.match(text, /No tool can promise/);
    assert.match(text, /do not need AI text files/);
  });

  it('adds Huntsville and Birmingham guides with advice, not invented observations', () => {
    for (const slug of ['huntsville-al', 'birmingham-al']) {
      const page = getFpgAeoPage(slug);
      assert.ok(page, slug);
      assert.equal(page.checksEyebrow, 'WHAT TO CHECK FIRST');
      assert.ok(page.title.length <= 60);
      assert.ok(page.description.length <= 155);
      assert.doesNotMatch(`${page.checksTitle} ${page.checks.join(' ')}`, /our .* checks showed/i);
    }
  });
});
