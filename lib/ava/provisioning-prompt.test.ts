import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildAvaAgentPrompt } from '@/lib/ava/provisioning';

const details = {
  businessName: 'Porchlight Heating & Air',
  businessHours: 'Mon-Fri 7:30-5:30',
  services: 'Heating and AC repair',
  callHandlingRules: 'Take a message.',
  staffName: 'Cole',
  staffContact: 'owner@shop.example',
  calendarPreference: 'The owner gets the details and follows up with the caller.',
  urgentCallRules: 'No heat with an infant is urgent.',
};

describe('agent prompt lead handoff', () => {
  const prompt = buildAvaAgentPrompt(details);

  it('says the owner gets details by email, and by text only if opted in', () => {
    assert.ok(prompt.includes("The owner gets the caller's details by email right away"));
    assert.ok(prompt.includes('by text only if they have opted in'));
    assert.ok(!/owner gets the lead by text/i.test(prompt));
  });

  it('never lets the agent promise a text or a callback time', () => {
    assert.ok(prompt.includes('Never promise the caller a text message'));
    assert.ok(prompt.includes('never promise a callback time'));
  });
});
