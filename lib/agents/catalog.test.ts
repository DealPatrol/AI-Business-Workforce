import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AGENT_IDS, agentInstructions, getAgent, isAgentId, readAgentFields } from '@/lib/agents/catalog';

describe('writing agents', () => {
  it('covers every agent id in the prompt switch', () => {
    for (const id of AGENT_IDS) {
      const text = agentInstructions(id, { business: 'Northside' });
      assert.match(text, /JSON only/);
      assert.match(text, /Northside/);
    }
  });

  it('rejects a missing required field', () => {
    const agent = getAgent('estimate');
    assert.ok(agent);
    const result = readAgentFields(agent, { business: 'A' });
    assert.equal(result.ok, false);
  });

  it('rejects an unknown id', () => {
    assert.equal(isAgentId('dispatcher'), false);
  });
});
