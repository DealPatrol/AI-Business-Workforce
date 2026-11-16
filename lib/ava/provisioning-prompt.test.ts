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
    assert.ok(prompt.includes('by text only if the owner has opted in to lead-alert texts'));
    assert.ok(!/owner gets the lead by text/i.test(prompt));
  });

  it('requires the verbal SMS consent script and never promises a callback time', () => {
    assert.ok(prompt.includes('VERBAL SMS CONSENT'));
    assert.ok(prompt.includes("This is Ava with Executive Receptionist, helping [Business]. Would you like me to text you at the number you're calling from about this call?"));
    assert.ok(prompt.includes('Message and data rates may apply'));
    assert.ok(prompt.includes('You can reply STOP anytime to opt out, or HELP for help'));
    assert.ok(prompt.includes('Would you like to receive these texts? Please say yes or no.'));
    assert.ok(prompt.includes('Never promise a callback time'));
  });
});
