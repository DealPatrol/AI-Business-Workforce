'use client';

import { trackVercelEvent } from '@/lib/analytics/vercel-events';

type SampleCallProps = {
  id?: string;
  src?: string;
  title: string;
  detail: string;
  className?: string;
  surface?: string;
};

export function SampleCall({
  id = 'hear-demo',
  src = '/ava-sample-call.mp4',
  title,
  detail,
  className = 'sample-call',
  surface = 'sample-call',
}: SampleCallProps) {
  return (
    <figure className={className} id={id}>
      <figcaption>
        <strong>{title}</strong>
        <span>{detail}</span>
      </figcaption>
      <audio
        controls
        preload="metadata"
        onPlay={() => trackVercelEvent('demo-play', { surface })}
      >
        <source src={src} type="audio/mp4" />
        Your browser does not support audio playback.
      </audio>
    </figure>
  );
}
