'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ExclusiveAudio } from '@/components/receptionist/ExclusiveAudio';
import {
  DEFAULT_ER_DEMO_SLUG,
  ER_DEMO_NICHES,
  type ErDemoSlug,
  getErDemoNiche,
} from '@/lib/er-demos';
import styles from '@/app/receptionist/receptionist.module.css';

type Props = {
  initialSlug?: string;
  syncUrl?: boolean;
};

export function IndustryDemo({ initialSlug, syncUrl = true }: Props) {
  const resolved = getErDemoNiche(initialSlug)?.slug ?? DEFAULT_ER_DEMO_SLUG;
  const [slug, setSlug] = useState<ErDemoSlug>(resolved);
  const [liveOpen, setLiveOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const fromProp = getErDemoNiche(initialSlug)?.slug;
    if (fromProp && fromProp !== slug) setSlug(fromProp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlug]);

  const niche = useMemo(
    () => getErDemoNiche(slug) ?? ER_DEMO_NICHES[0],
    [slug],
  );

  useEffect(() => {
    setLiveOpen(false);
  }, [niche.slug]);

  useEffect(() => {
    if (!document.getElementById('elevenlabs-convai-embed')) {
      const script = document.createElement('script');
      script.id = 'elevenlabs-convai-embed';
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      document.body.appendChild(script);
    }
  }, []);

  function selectNiche(next: ErDemoSlug) {
    setSlug(next);
    if (!syncUrl) return;
    if (pathname === '/receptionist') {
      router.replace(`/receptionist?industry=${next}#demo`, { scroll: false });
    } else if (pathname.startsWith('/receptionist/')) {
      router.replace(`/receptionist/${next}#demo`, { scroll: false });
    }
  }

  return (
    <div className={styles.demoShell}>
      <div className={styles.demoTabs} role="tablist" aria-label="Choose a trade to hear its demo">
        {ER_DEMO_NICHES.map((item) => {
          const selected = item.slug === niche.slug;
          return (
            <button
              key={item.slug}
              type="button"
              role="tab"
              id={`demo-tab-${item.slug}`}
              aria-selected={selected}
              aria-controls={`demo-panel-${item.slug}`}
              className={selected ? styles.demoTabOn : styles.demoTab}
              onClick={() => selectNiche(item.slug)}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      <div
        className={styles.demoPanel}
        role="tabpanel"
        id={`demo-panel-${niche.slug}`}
        aria-labelledby={`demo-tab-${niche.slug}`}
      >
        <div>
          <p className={styles.kicker}>{niche.company}</p>
          <h3>Sample {niche.name.toLowerCase()} call</h3>
          <p>{niche.line}</p>
          <ExclusiveAudio src={niche.audioSrc}>Sample {niche.name} call</ExclusiveAudio>
          <details className={styles.demoTranscript}>
            <summary>Read the transcript</summary>
            <ol>
              {niche.transcript.map((line, index) => (
                <li key={`${niche.slug}-${index}`}>
                  <strong>{line.speaker}</strong>
                  <span>{line.text}</span>
                </li>
              ))}
            </ol>
          </details>
        </div>

        <div className={styles.demoLive}>
          <h3>Talk to this receptionist</h3>
          <p>
            This is a live browser call with a fictional {niche.name.toLowerCase()} shop, {niche.company}.
            No extra phone number is used. Your browser will ask for microphone permission.
          </p>
          <div className={styles.demoActions}>
            <button type="button" className={styles.gold} onClick={() => setLiveOpen(true)}>
              {niche.talkLabel}
            </button>
            <a className={styles.quiet} href={niche.talkUrl} target="_blank" rel="noopener noreferrer">
              Open the public talk page
            </a>
          </div>
          {liveOpen ? (
            <div className={styles.demoWidget}>
              <p className={styles.fine}>
                Allow the microphone when your browser asks. Say you have a service problem, or ask if this is a demo.
              </p>
              <elevenlabs-convai agent-id={niche.agentId}></elevenlabs-convai>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
