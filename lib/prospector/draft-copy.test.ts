import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applySenderIdentity,
  buildDraftInstructions,
  requireSenderName,
  SENDER_NAME_REQUIRED,
} from '@/lib/prospector/draft-copy';
import { ValidationError } from '@/lib/prospector/errors';
import type { ProspectorLead } from '@/lib/prospector/types';

const lead: ProspectorLead = {
  id: 'lead-1',
  campaignId: 'campaign-1',
  placeId: 'place-1',
  name: 'Oak Lawn Funeral Home',
  category: 'Funeral home',
  types: ['funeral_home'],
  address: '12 Main St, Tampa, FL',
  phone: '813-555-0100',
  website: 'https://oaklawnfuneral.com',
  rating: 4.8,
  reviewCount: 42,
  mapsUrl: 'https://maps.example/oak',
  emails: ['director@oaklawnfuneral.com'],
  contactName: 'Maria Lopez',
  enrichmentStatus: 'enriched',
  channel: 'email',
  status: 'new',
  searchQuery: 'funeral home',
};

describe('draft identity', () => {
  it('blocks drafting until a sender name is saved', () => {
    for (const name of ['', '   ', '\n']) {
      assert.throws(
        () => requireSenderName(name),
        (error: unknown) => error instanceof ValidationError && error.message === SENDER_NAME_REQUIRED,
      );
      assert.throws(
        () => buildDraftInstructions({
          lead,
          offerSummary: 'Monument care',
          sourceUrl: 'https://yard.example',
          notes: '',
          senderName: name,
          bookingUrl: 'https://cal.com/cole',
        }),
        (error: unknown) => error instanceof ValidationError && error.message === SENDER_NAME_REQUIRED,
      );
    }
  });

  it('asks for the saved sender name and booking link', () => {
    const prompt = buildDraftInstructions({
      lead,
      offerSummary: 'Monument care',
      sourceUrl: 'https://yard.example',
      notes: 'Family owned',
      senderName: 'Cole',
      bookingUrl: 'https://cal.com/cole',
    });
    assert.match(prompt, /From: Cole/);
    assert.match(prompt, /https:\/\/cal\.com\/cole/);
    assert.equal(prompt.toLowerCase().includes('the sender'), false);
    assert.equal(requireSenderName('  Cole \n '), 'Cole');
  });

  it('does not invent a booking link when settings have none', () => {
    const prompt = buildDraftInstructions({
      lead,
      offerSummary: 'Monument care',
      sourceUrl: 'https://yard.example',
      notes: '',
      senderName: 'Cole',
      bookingUrl: '   ',
    });
    assert.match(prompt, /Booking link: not set/);
    assert.equal(prompt.includes('cal.com'), false);
    assert.equal(prompt.toLowerCase().includes('the sender'), false);
  });

  it('replaces a stand-in name and keeps the booking link', () => {
    const drafts = applySenderIdentity(
      [
        {
          kind: 'initial' as const,
          subject: 'Hello from the sender',
          body: "I'm the sender. I help funeral homes.\n\nThanks,\nthe sender",
        },
        {
          kind: 'followup_1' as const,
          subject: 'Checking in',
          body: 'Wanted to follow up.\n\nSender',
        },
        {
          kind: 'followup_2' as const,
          subject: 'Last note',
          body: 'Closing the loop.\n\n[Your Name]',
        },
      ],
      'Cole',
      'https://cal.com/cole',
    );
    assert.equal(drafts[0]?.subject, 'Hello from Cole');
    assert.match(drafts[0]?.body ?? '', /I'm Cole/);
    assert.equal((drafts[0]?.body.match(/I'm Cole/g) ?? []).length, 1);
    assert.match(drafts[0]?.body ?? '', /Thanks,\nCole/);
    assert.equal(drafts[0]?.body.includes('the sender'), false);
    assert.match(drafts[1]?.body ?? '', /follow up\.\n\nCole/);
    assert.match(drafts[2]?.body ?? '', /Closing the loop\.\n\nCole/);
    for (const draft of drafts) {
      assert.equal(draft.body.includes('https://cal.com/cole'), true);
      assert.equal(draft.body.split('https://cal.com/cole').length - 1, 1);
    }
  });

  it('does not duplicate a booking link that is already in the draft', () => {
    const [draft] = applySenderIdentity(
      [{
        kind: 'initial' as const,
        subject: 'Monument care for Oak Lawn',
        body: 'Hi Maria,\n\nI can help with monument care.\n\nhttps://cal.com/cole\n\nCole',
      }],
      'Cole',
      'https://cal.com/cole',
    );
    assert.equal(draft?.body.split('https://cal.com/cole').length - 1, 1);
    assert.equal(draft?.body.split('\nCole').length - 1, 1);
  });
});
