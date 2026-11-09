'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { type ErDemoSlug, getErDemoNiche } from '@/lib/er-demos';
import styles from '@/components/suite/home.module.css';

/**
 * Homepage hero sample: pick a trade, hear a recorded sample call, or open the
 * live browser demo. Only five recorded demos exist (HVAC, plumbing, roofing,
 * electrical, auto repair); every other trade plays the closest one and says
 * which one it is.
 */
type HeroIndustry = { slug: string; label: string; demo: ErDemoSlug };

export const HERO_INDUSTRIES: readonly HeroIndustry[] = [
  { slug: 'hvac', label: 'HVAC', demo: 'hvac' },
  { slug: 'plumbing', label: 'Plumbing', demo: 'plumbing' },
  { slug: 'roofing', label: 'Roofing', demo: 'roofing' },
  { slug: 'electrical', label: 'Electrical', demo: 'electrical' },
  { slug: 'lawn-care', label: 'Lawn care', demo: 'roofing' },
  { slug: 'landscaping', label: 'Landscaping', demo: 'roofing' },
  { slug: 'pressure-washing', label: 'Pressure washing', demo: 'roofing' },
  { slug: 'cleaning', label: 'Cleaning', demo: 'hvac' },
  { slug: 'pest-control', label: 'Pest control', demo: 'hvac' },
  { slug: 'tree-service', label: 'Tree service', demo: 'roofing' },
  { slug: 'fencing', label: 'Fencing', demo: 'roofing' },
  { slug: 'painting', label: 'Painting', demo: 'roofing' },
  { slug: 'pool-service', label: 'Pool service', demo: 'plumbing' },
  { slug: 'auto-repair', label: 'Auto repair', demo: 'auto-repair' },
];

const ALIASES: Record<string, string> = {
  'heating-and-air': 'hvac',
  plumber: 'plumbing',
  plumbers: 'plumbing',
  roofer: 'roofing',
  roofers: 'roofing',
  electric: 'electrical',
  electrician: 'electrical',
  electricians: 'electrical',
  lawn: 'lawn-care',
  lawncare: 'lawn-care',
  'lawn-service': 'lawn-care',
  landscaper: 'landscaping',
  landscapers: 'landscaping',
  'pressure-wash': 'pressure-washing',
  'power-washing': 'pressure-washing',
  cleaners: 'cleaning',
  cleaner: 'cleaning',
  'house-cleaning': 'cleaning',
  pest: 'pest-control',
  tree: 'tree-service',
  'tree-services': 'tree-service',
  fence: 'fencing',
  painter: 'painting',
  painters: 'painting',
  pool: 'pool-service',
  pools: 'pool-service',
  'pool-companies': 'pool-service',
  auto: 'auto-repair',
  automotive: 'auto-repair',
  mechanic: 'auto-repair',
};

function resolveIndustry(raw: string | null | undefined): HeroIndustry | undefined {
  if (!raw) return undefined;
  const key = raw.trim().toLowerCase().replace(/[\s_]+/g, '-');
  const slug = ALIASES[key] ?? key;
  return HERO_INDUSTRIES.find((item) => item.slug === slug);
}

function tradeWord(label: string) {
  return label === 'HVAC' ? label : label.toLowerCase();
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function HeroDemoPicker() {
  const selectId = useId();
  const noteId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [industry, setIndustry] = useState<HeroIndustry>(HERO_INDUSTRIES[0]);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  // Preselect from ?industry= so each ad can link to its trade.
  useEffect(() => {
    const fromUrl = resolveIndustry(new URLSearchParams(window.location.search).get('industry'));
    if (fromUrl) setIndustry(fromUrl);
  }, []);

  const demo = getErDemoNiche(industry.demo)!;
  const isExact = industry.demo === industry.slug;

  function choose(slug: string) {
    const next = resolveIndustry(slug);
    if (!next) return;
    audioRef.current?.pause();
    setPlaying(false);
    setElapsed(0);
    setDuration(0);
    setIndustry(next);
    const url = new URL(window.location.href);
    url.searchParams.set('industry', next.slug);
    window.history.replaceState(window.history.state, '', url.toString());
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      document.querySelectorAll<HTMLMediaElement>('audio, video').forEach((el) => {
        if (el !== audio && !el.paused) el.pause();
      });
      void audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }

  const progress = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

  return (
    <div className={styles.heroDemo} id="hear-it">
      <div className={styles.heroDemoRow}>
        <label className={styles.heroDemoLabel} htmlFor={selectId}>
          Hear it for your trade
        </label>
        <select
          id={selectId}
          className={styles.heroDemoSelect}
          value={industry.slug}
          onChange={(event) => choose(event.target.value)}
          aria-describedby={noteId}
        >
          {HERO_INDUSTRIES.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.heroDemoActions}>
        <button
          type="button"
          className={styles.heroDemoPlay}
          onClick={toggle}
          aria-label={`${playing ? 'Pause' : 'Play'} sample call (${demo.name} example)`}
        >
          <span className={styles.heroDemoIcon} aria-hidden="true">
            {playing ? (
              <svg viewBox="0 0 16 16" width="14" height="14"><rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor" /><rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 16 16" width="14" height="14"><path d="M4 2.5v11a.6.6 0 0 0 .9.5l9-5.5a.6.6 0 0 0 0-1l-9-5.5a.6.6 0 0 0-.9.5z" fill="currentColor" /></svg>
            )}
          </span>
          <span className={styles.heroDemoPlayText}>
            {playing ? 'Pause sample' : 'Play sample'}
            <small>
              {duration > 0 || elapsed > 0 ? `${formatTime(elapsed)} / ${formatTime(duration)}` : `${demo.name} example`}
            </small>
          </span>
        </button>
        <a className={styles.heroDemoTalk} href={demo.talkUrl} target="_blank" rel="noopener noreferrer">
          Talk to the receptionist
          <span className={styles.srOnly}> ({demo.name} demo, opens in a new tab)</span>
        </a>
      </div>

      <div className={styles.heroDemoBar} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <p className={styles.heroDemoNote} id={noteId}>
        {isExact
          ? `Sample call with ${demo.company}, a made-up ${tradeWord(demo.name)} shop.`
          : `Sample call (${demo.name} example). A ${tradeWord(industry.label)} version is written for your business at setup.`}
        <span className={styles.heroDemoMic}> The live demo runs in your browser and asks for your microphone.</span>
      </p>

      <audio
        key={demo.audioSrc}
        ref={audioRef}
        src={demo.audioSrc}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setElapsed(0);
        }}
        onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      />
    </div>
  );
}
