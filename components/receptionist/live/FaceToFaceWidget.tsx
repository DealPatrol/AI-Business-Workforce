'use client';

import { useState } from 'react';
import { LiveVideoReceptionist } from './LiveVideoReceptionist';
import styles from './live.module.css';

/**
 * Floating "Talk to us face to face" launcher. Not mounted anywhere by default;
 * render it only when NEXT_PUBLIC_LIVE_AVATAR_WIDGET=1 (see liveWidgetEnabled()).
 */
export function FaceToFaceWidget() {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.widget}>
      {open ? (
        <div className={styles.widgetPanel} role="dialog" aria-label="Talk to our AI assistant">
          <button type="button" className={styles.widgetClose} onClick={() => setOpen(false)} aria-label="Close">
            ×
          </button>
          <LiveVideoReceptionist compact />
        </div>
      ) : (
        <button type="button" className={styles.widgetLauncher} onClick={() => setOpen(true)}>
          Talk to us face to face
          <small>AI assistant</small>
        </button>
      )}
    </div>
  );
}
