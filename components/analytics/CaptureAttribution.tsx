'use client';

import { useEffect } from 'react';
import { captureAttributionFromLocation } from '@/lib/analytics/attribution';

/** Remembers gclid, fbclid, and UTMs from the landing URL. Does not load any ad tag. */
export function CaptureAttribution() {
  useEffect(() => {
    captureAttributionFromLocation();
  }, []);
  return null;
}
