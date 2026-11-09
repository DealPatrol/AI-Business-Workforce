import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildWebChatEmbedSnippet,
  channelSummaryLine,
  parseChannelFlags,
} from './channels';

test('parseChannelFlags defaults voice on and others off', () => {
  assert.deepEqual(parseChannelFlags({}), {
    channelVoice: true,
    channelSms: false,
    channelWebChat: false,
  });
});

test('parseChannelFlags respects explicit false for voice', () => {
  assert.equal(parseChannelFlags({ channelVoice: false }).channelVoice, false);
});

test('embed snippet includes agent id', () => {
  const snip = buildWebChatEmbedSnippet('agent_test123');
  assert.match(snip, /agent-id="agent_test123"/);
  assert.match(snip, /convai-widget-embed/);
});

test('channel summary names texting after setup', () => {
  assert.match(
    channelSummaryLine({ channelVoice: true, channelSms: true, channelWebChat: true }),
    /available after setup/,
  );
});
