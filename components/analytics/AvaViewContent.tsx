'use client';

import { useEffect } from 'react';
import { trackViewContent } from '@/lib/analytics/events';

export function AvaViewContent() {
  useEffect(() => {
    trackViewContent(window.location.pathname);
  }, []);
  return null;
}
