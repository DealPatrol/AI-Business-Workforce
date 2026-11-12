import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { AVA_VOICE, PREVIOUS_AVA_VOICE_ID } from '@/lib/ava/voice';
import {
  AVA_GREETING_SRC,
  AVA_GREETING_TRANSCRIPT,
  DEFAULT_TALK_AGENT_ID,
  TALK_MAX_SECONDS,
  formatClock,
  isNoMicError,
  takeTalkSession,
  talkAgentId,
} from '@/lib/ava/talk-to-ava';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p: string) => readFileSync(path.join(root, p), 'utf8');

describe('Talk to Ava', () => {
  it('uses the dedicated public web-demo agent, capped at 3 minutes', () => {
    assert.equal(DEFAULT_TALK_AGENT_ID, 'agent_8101m78w0ks0fv5vzwysbdr9s6z8');
    assert.equal(talkAgentId(), process.env.ELEVENLABS_TALK_AGENT_ID || DEFAULT_TALK_AGENT_ID);
    assert.equal(TALK_MAX_SECONDS, 180);
    assert.equal(formatClock(180), '3:00');
    assert.equal(formatClock(5), '0:05');
  });

  it('ships the pre-recorded greeting in the repo', () => {
    const file = path.join(root, 'public', AVA_GREETING_SRC);
    assert.ok(existsSync(file));
    assert.ok(statSync(file).size > 20_000);
    assert.match(AVA_GREETING_TRANSCRIPT, /Ava, the AI receptionist from Executive Receptionist/);
  });

  it('falls back on denied or missing microphones', () => {
    for (const name of ['NotAllowedError', 'NotFoundError', 'NotReadableError', 'SecurityError']) {
      assert.equal(isNoMicError({ name }), true, name);
    }
    assert.equal(isNoMicError({ name: 'AbortError' }), false);
    assert.equal(isNoMicError(null), false);
  });

  it('rate limits new sessions per visitor', () => {
    const ip = `test-${Date.now()}`;
    for (let i = 0; i < 4; i += 1) assert.equal(takeTalkSession(ip).ok, true);
    assert.equal(takeTalkSession(ip).ok, false);
  });

  it('renders under every plan card, labeled as a demo, with only the public demo number', () => {
    const plans = read('components/ava/MonthlyPlans.tsx');
    assert.match(plans, /<TalkToAvaButton plan=\{key\} \/>/);
    const button = read('components/ava/TalkToAvaButton.tsx');
    assert.match(button, /Talk to Ava/);
    assert.match(button, /Live demo/);
    assert.match(button, /AVA_DEMO_LINE/);
    assert.match(button, /AVA_GREETING_SRC/);
    for (const src of [button, plans, read('lib/ava/talk-to-ava.ts'), read('app/api/ava/talk/route.ts')]) {
      assert.doesNotMatch(src, /663[-. ]?7007/);
    }
    assert.match(read('lib/ava/demo-line.ts'), /\(256\) 952-4935/);
  });

  it('never returns the API key from the session route', () => {
    const route = read('app/api/ava/talk/route.ts');
    assert.match(route, /signedUrl: data\.signed_url/);
    assert.doesNotMatch(route, /apiKey[^)]*NextResponse|json\(\{[^}]*apiKey/);
    assert.match(route, /no-store/);
  });
});

describe('Ava voice (Jen)', () => {
  it('uses Jen for every new customer agent', () => {
    assert.equal(AVA_VOICE.id, 'QLAlOeRuLwKX0skeTR7R');
    assert.notEqual(AVA_VOICE.id, PREVIOUS_AVA_VOICE_ID);
    const provisioning = read('lib/ava/provisioning.ts');
    assert.match(provisioning, /tts: \{ voice_id: AVA_VOICE\.id \}/);
    assert.doesNotMatch(provisioning, /EXAVITQu4vr4xnSDxMaL/);
  });

  it('ships the fallback greeting recorded in Jen\'s voice', () => {
    const size = statSync(path.join(root, 'public', AVA_GREETING_SRC)).size;
    assert.ok(size > 60_000 && size < 400_000, `greeting size ${size}`);
    assert.match(read('lib/ava/talk-to-ava.ts'), /"Jen"/);
  });
});
