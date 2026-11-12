'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import {
  AVA_GREETING_SRC,
  AVA_GREETING_TRANSCRIPT,
  TALK_MAX_SECONDS,
  formatClock,
  isNoMicError,
} from '@/lib/ava/talk-to-ava';
import styles from './talk-to-ava.module.css';

type Phase = 'idle' | 'connecting' | 'live' | 'ended' | 'fallback';
type FallbackReason = 'no-mic' | 'busy';

/** Only one demo conversation on the page at a time: starting a new one ends the old one. */
let endActive: (() => void) | null = null;

function track(event: string, plan?: string) {
  try {
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.('event', event, { plan });
  } catch {
    // Analytics never blocks the demo.
  }
}

function TalkInner({ plan }: { plan?: string }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [reason, setReason] = useState<FallbackReason>('no-mic');
  const [left, setLeft] = useState(TALK_MAX_SECONDS);
  const [lastLine, setLastLine] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aliveRef = useRef(true);
  const lockRef = useRef(false);

  const conversation = useConversation({
    onConnect: () => {
      if (aliveRef.current) setPhase('live');
    },
    onDisconnect: () => {
      if (!aliveRef.current) return;
      stopTimer();
      setPhase((p) => (p === 'fallback' ? p : 'ended'));
    },
    onError: () => {
      // The SDK reports transient errors here; disconnects are handled in onDisconnect.
    },
    onMessage: (msg: { source?: string; message?: string }) => {
      if (aliveRef.current && msg?.source !== 'user' && msg?.message) setLastLine(msg.message);
    },
  });
  const convRef = useRef(conversation);
  convRef.current = conversation;

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  const end = useCallback(async () => {
    stopTimer();
    try {
      await convRef.current.endSession();
    } catch {
      // Already closed.
    }
    if (endActive === endRef.current) endActive = null;
  }, []);
  const endRef = useRef<() => void>(() => void end());

  useEffect(() => {
    aliveRef.current = true;
    const mine = endRef.current;
    return () => {
      aliveRef.current = false;
      stopTimer();
      try {
        void convRef.current.endSession();
      } catch {
        // Already closed.
      }
      if (endActive === mine) endActive = null;
    };
  }, []);

  function showFallback(why: FallbackReason) {
    stopTimer();
    setReason(why);
    setPhase('fallback');
    track('talk_to_ava_fallback', plan);
    // Try to play right away; if the browser blocks autoplay, the visible player is one tap away.
    requestAnimationFrame(() => {
      audioRef.current?.play().catch(() => undefined);
    });
  }

  async function start() {
    if (lockRef.current) return;
    lockRef.current = true;
    endActive?.();
    endActive = endRef.current;
    setLastLine('');
    setLeft(TALK_MAX_SECONDS);
    setPhase('connecting');
    track('talk_to_ava_start', plan);
    let mic: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('no mic'), { name: 'NotFoundError' });
      try {
        mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        if (isNoMicError(e)) return showFallback('no-mic');
        throw e;
      }
      const res = await fetch('/api/ava/talk', { cache: 'no-store' });
      const data = (await res.json().catch(() => ({}))) as { signedUrl?: string };
      if (!res.ok || !data.signedUrl) return showFallback('busy');
      if (!aliveRef.current) return;
      await convRef.current.startSession({ signedUrl: data.signedUrl, connectionType: 'websocket' });
      const startedAt = Date.now();
      stopTimer();
      timerRef.current = setInterval(() => {
        const remaining = TALK_MAX_SECONDS - Math.floor((Date.now() - startedAt) / 1000);
        setLeft(remaining);
        if (remaining <= 0) void end();
      }, 1000);
    } catch {
      showFallback('busy');
    } finally {
      mic?.getTracks().forEach((t) => t.stop());
      lockRef.current = false;
    }
  }

  const live = phase === 'live';
  const speaking = live && conversation.isSpeaking;

  return (
    <div className={styles.box} data-phase={phase}>
      {live || phase === 'connecting' ? (
        <div className={styles.liveRow}>
          <span className={styles.status} aria-live="polite">
            <i className={styles.dot} data-on={live} />
            {phase === 'connecting' ? 'Connecting to Ava…' : speaking ? 'Ava is talking…' : 'Ava is listening…'}
          </span>
          {live ? <span className={styles.clock}>{formatClock(left)} left</span> : null}
          <button type="button" className={styles.endBtn} onClick={() => void end()}>
            End demo
          </button>
        </div>
      ) : (
        <button type="button" className={styles.talkBtn} onClick={() => void start()} aria-label="Talk to Ava, a live voice demo using your microphone">
          <span aria-hidden="true">🎙️</span> {phase === 'ended' ? 'Talk to Ava again' : 'Talk to Ava'}
          <span className={styles.demoTag}>Live demo</span>
        </button>
      )}

      {live && lastLine ? <p className={styles.line}>&ldquo;{lastLine}&rdquo;</p> : null}

      {phase === 'fallback' ? (
        <div className={styles.fallback}>
          <p className={styles.fallbackHead}>
            {reason === 'no-mic'
              ? 'No microphone? Here is Ava’s voice instead.'
              : 'Ava’s live demo is busy right now. Here is her voice instead.'}
          </p>
          <audio ref={audioRef} className={styles.audio} src={AVA_GREETING_SRC} controls preload="none" />
          <p className={styles.transcript}>{AVA_GREETING_TRANSCRIPT}</p>
        </div>
      ) : null}

      <p className={styles.fine}>
        {phase === 'ended'
          ? 'Demo ended. '
          : 'Demo with Ava in your browser · up to 3 min · uses your mic. '}
        Or call the demo line{' '}
        <a href={AVA_DEMO_LINE.href} className={styles.tel}>
          {AVA_DEMO_LINE.display}
        </a>
        .
      </p>
    </div>
  );
}

/** "Talk to Ava" live voice demo, shown under each plan card. */
export function TalkToAvaButton({ plan }: { plan?: string }) {
  return (
    <ConversationProvider>
      <TalkInner plan={plan} />
    </ConversationProvider>
  );
}
