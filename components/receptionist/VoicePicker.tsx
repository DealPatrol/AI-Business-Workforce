'use client';

import { useState } from 'react';
import { DEFAULT_EXECUTIVE_VOICE, EXECUTIVE_VOICES, type ExecutiveVoiceSlug } from '@/lib/executive-receptionist';
import styles from '@/app/receptionist/receptionist.module.css';

export function VoicePicker() {
  const [active, setActive] = useState<ExecutiveVoiceSlug>(DEFAULT_EXECUTIVE_VOICE);

  return (
    <ul className={styles.voiceList}>
      {EXECUTIVE_VOICES.map((voice) => {
        const selected = voice.slug === active;
        return (
          <li key={voice.slug} className={selected ? styles.voiceOn : undefined}>
            <button type="button" aria-pressed={selected} onClick={() => setActive(voice.slug)}>
              <span>{voice.name}</span>
              {voice.isDefault ? <small>Default</small> : null}
            </button>
            <p>{voice.detail}</p>
            <audio controls preload="none" src={`/voices/${voice.slug}.mp3`}>
              {voice.name}
            </audio>
          </li>
        );
      })}
    </ul>
  );
}
