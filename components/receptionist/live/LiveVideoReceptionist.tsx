'use client';

import { useCallback, useRef, useState } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { LIVE_DEMO_PHONE_DISPLAY, LIVE_DEMO_PHONE_HREF } from '@/lib/ava/demo-phone';
import { LiveAvatar, type AvatarMouth } from './LiveAvatar';
import styles from './live.module.css';

type SessionInfo = { mode: 'signed'; signedUrl: string } | { mode: 'public'; agentId: string };
type Phase = 'idle' | 'connecting' | 'live' | 'ended';
type Line = { from: 'ai' | 'you'; text: string };

function Inner({ compact = false }: { compact?: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [lines, setLines] = useState<Line[]>([]);

  const conversation = useConversation({
    onConnect: () => setPhase('live'),
    onDisconnect: () => setPhase((p) => (p === 'connecting' ? 'idle' : 'ended')),
    onError: (message: unknown) => {
      setError(typeof message === 'string' ? message : 'The live receptionist could not continue.');
    },
    onMessage: (msg: { source?: string; message?: string }) => {
      if (!msg?.message) return;
      const from = msg.source === 'user' ? 'you' : 'ai';
      setLines((l) => [...l.slice(-5), { from, text: msg.message as string }]);
    },
  });

  const convRef = useRef(conversation);
  convRef.current = conversation;

  const sample = useCallback((): AvatarMouth => {
    const c = convRef.current;
    if (c.status !== 'connected' || !c.isSpeaking) return { open: 0, wide: 0.5 };
    let freq: Uint8Array | undefined;
    try {
      freq = c.getOutputByteFrequencyData();
    } catch {
      freq = undefined;
    }
    if (!freq || freq.length === 0) {
      const v = c.getOutputVolume?.() ?? 0;
      return { open: Math.min(1, v * 2.2), wide: 0.5 };
    }
    // Speech energy lives mostly in the lower bins; vowel "width" ~ ratio of upper to lower energy.
    const n = freq.length;
    const lowEnd = Math.max(4, Math.floor(n * 0.08));
    const highEnd = Math.max(lowEnd + 4, Math.floor(n * 0.35));
    let low = 0;
    let high = 0;
    for (let i = 1; i < lowEnd; i++) low += freq[i];
    for (let i = lowEnd; i < highEnd; i++) high += freq[i];
    low /= (lowEnd - 1) * 255;
    high /= (highEnd - lowEnd) * 255;
    const open = Math.min(1, Math.max(0, (low - 0.08) * 1.9));
    const wide = Math.min(1, Math.max(0, high / (low + 0.0001)));
    return { open, wide };
  }, []);

  async function start() {
    setError('');
    setLines([]);
    setPhase('connecting');
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access is needed to talk. You can call instead.');
      setPhase('idle');
      return;
    }
    try {
      const res = await fetch('/api/receptionist/live/session', { cache: 'no-store' });
      const info = (await res.json()) as SessionInfo;
      if (info.mode === 'signed') {
        await conversation.startSession({ signedUrl: info.signedUrl, connectionType: 'websocket' });
      } else {
        await conversation.startSession({ agentId: info.agentId, connectionType: 'websocket' });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect. Please call instead.');
      setPhase('idle');
    }
  }

  async function stop() {
    await conversation.endSession();
    setPhase('ended');
  }

  const avatarState =
    phase === 'connecting'
      ? 'connecting'
      : phase === 'live'
        ? conversation.isSpeaking
          ? 'speaking'
          : 'listening'
        : 'idle';

  const statusText =
    phase === 'connecting'
      ? 'Connecting…'
      : phase === 'live'
        ? conversation.isSpeaking
          ? 'Speaking'
          : 'Listening — go ahead'
        : phase === 'ended'
          ? 'Call ended'
          : 'Ready';

  return (
    <div className={`${styles.stage} ${compact ? styles.compact : ''}`}>
      <div className={styles.frame} data-state={avatarState}>
        <LiveAvatar sample={sample} state={avatarState} />
        <span className={styles.aiBadge}>AI assistant · not a real person</span>
        <span className={styles.status} aria-live="polite">
          <i className={styles.dot} data-on={phase === 'live'} /> {statusText}
        </span>
      </div>

      <div className={styles.controls}>
        {phase === 'live' || phase === 'connecting' ? (
          <button type="button" className={styles.endBtn} onClick={stop} disabled={phase === 'connecting'}>
            End conversation
          </button>
        ) : (
          <button type="button" className={styles.startBtn} onClick={start}>
            {phase === 'ended' ? 'Start again' : 'Start — talk face to face'}
          </button>
        )}
        <a className={styles.callBtn} href={LIVE_DEMO_PHONE_HREF}>
          Call {LIVE_DEMO_PHONE_DISPLAY}
        </a>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {!compact && lines.length > 0 ? (
        <ol className={styles.transcript} aria-label="Live captions">
          {lines.map((l, i) => (
            <li key={i} data-from={l.from}>
              <b>{l.from === 'ai' ? 'AI' : 'You'}:</b> {l.text}
            </li>
          ))}
        </ol>
      ) : null}

      <p className={styles.fine}>
        You are talking to an AI voice assistant shown as an illustrated character. Your microphone is used only while
        the conversation is open. It answers as the demo business “Front Porch Heating &amp; Air.”
      </p>
    </div>
  );
}

export function LiveVideoReceptionist({ compact = false }: { compact?: boolean }) {
  return (
    <ConversationProvider>
      <Inner compact={compact} />
    </ConversationProvider>
  );
}
