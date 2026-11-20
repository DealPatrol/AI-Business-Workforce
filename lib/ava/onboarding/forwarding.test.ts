import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { forwardingSteps } from '@/lib/ava/onboarding/forwarding';

describe('forwarding codes', () => {
  it('builds GSM no-answer codes with a ring time', () => {
    const s = forwardingSteps('att', 'missed', '+1 (256) 555-0100', 15);
    assert.deepEqual(s.dial, ['**61*2565550100**15#', '**67*2565550100#', '**62*2565550100#']);
    assert.deepEqual(s.undo, ['##61#', '##67#', '##62#']);
  });
  it('uses Verizon star codes', () => {
    assert.deepEqual(forwardingSteps('verizon', 'all', '2565550100').dial, ['*722565550100']);
    assert.deepEqual(forwardingSteps('verizon', 'missed', '2565550100').undo, ['*73']);
  });
  it('falls back to a safe default ring time', () => {
    assert.equal(forwardingSteps('tmobile', 'missed', '2565550100', 17).dial[0], '**61*2565550100**20#');
  });
});
