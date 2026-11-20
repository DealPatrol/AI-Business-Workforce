'use client';

import { useState } from 'react';
import type { ErFeature } from '@/lib/ava/er-home-content';
import styles from './er-home.module.css';

export function FeatureTabs({ features }: { features: ErFeature[] }) {
  const [active, setActive] = useState(features[0]?.key);
  const current = features.find((f) => f.key === active) ?? features[0];

  return (
    <div className={styles.tabs}>
      <div className={styles.tabList} role="tablist" aria-label="What Ava does">
        {features.map((feature) => {
          const selected = feature.key === current.key;
          return (
            <button
              key={feature.key}
              type="button"
              role="tab"
              id={`feature-tab-${feature.key}`}
              aria-selected={selected}
              aria-controls="feature-panel"
              className={selected ? styles.tabOn : styles.tab}
              onClick={() => setActive(feature.key)}
            >
              {feature.tab}
              {feature.status === 'coming' ? <span className={styles.soon}>Soon</span> : null}
            </button>
          );
        })}
      </div>
      <div className={styles.tabPanel} role="tabpanel" id="feature-panel" aria-labelledby={`feature-tab-${current.key}`}>
        <div className={styles.tabCopy}>
          <h3>{current.title}</h3>
          <p>{current.body}</p>
        </div>
        <div className={styles.mock} aria-label="Example">
          <p className={current.status === 'coming' ? styles.mockLabelSoon : styles.mockLabel}>
            <span aria-hidden="true" />
            {current.mock.label}
          </p>
          {current.mock.lines.map((line, index) => (
            <p key={`${current.key}-${index}`} className={styles[`bubble_${line.who}`]}>
              {line.text}
            </p>
          ))}
          <p className={styles.mockFoot}>Example call. Not a real customer.</p>
        </div>
      </div>
    </div>
  );
}
