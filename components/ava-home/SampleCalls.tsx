'use client';

import type { SyntheticEvent } from 'react';
import { ER_DEMO_NICHES } from '@/lib/er-demos';
import styles from './ava-home.module.css';

function pauseOthers(event: SyntheticEvent<HTMLAudioElement>) {
  const current = event.currentTarget;
  document.querySelectorAll<HTMLMediaElement>('audio, video').forEach((el) => {
    if (el !== current && !el.paused) el.pause();
  });
}

/** Every recorded sample call, each with its transcript and a live browser demo link. */
export function SampleCalls({ order }: { order?: readonly string[] }) {
  const niches = order
    ? order
        .map((slug) => ER_DEMO_NICHES.find((niche) => niche.slug === slug))
        .filter((niche): niche is (typeof ER_DEMO_NICHES)[number] => Boolean(niche))
    : ER_DEMO_NICHES;
  return (
    <ul className={styles.samples}>
      {niches.map((niche) => (
        <li key={niche.slug} className={styles.sample} id={`sample-${niche.slug}`}>
          <div className={styles.sampleHead}>
            <span className={styles.sampleTag}>{niche.name}</span>
            <h3>{niche.company}</h3>
          </div>
          <p>{niche.line}</p>
          <audio controls preload="none" src={niche.audioSrc} onPlay={pauseOthers} aria-label={`${niche.name} sample call`}>
            <a href={niche.audioSrc}>Download the {niche.name} sample call</a>
          </audio>
          <details>
            <summary>Read the transcript</summary>
            <ol className={styles.transcript}>
              {niche.transcript.map((turn, index) => (
                <li key={index}>
                  <b>{turn.speaker === 'Receptionist' ? 'Ava' : 'Caller'}:</b> {turn.text}
                </li>
              ))}
            </ol>
          </details>
          <a className={styles.sampleTalk} href={niche.talkUrl} target="_blank" rel="noopener noreferrer">
            Talk to this demo live<span className={styles.srOnly}> (opens in a new tab, uses your microphone)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
