'use client';

import { useRef, type ReactNode } from 'react';

/**
 * Click-to-play audio sample. Never autoplays; starting one sample pauses
 * any other <audio>/<video> currently playing on the page.
 */
export function ExclusiveAudio({ src, children }: { src: string; children?: ReactNode }) {
  const ref = useRef<HTMLAudioElement>(null);
  return (
    <audio
      ref={ref}
      controls
      preload="none"
      src={src}
      onPlay={() => {
        document.querySelectorAll<HTMLMediaElement>('audio, video').forEach((el) => {
          if (el !== ref.current && !el.paused && !el.muted) el.pause();
        });
      }}
    >
      {children}
    </audio>
  );
}
