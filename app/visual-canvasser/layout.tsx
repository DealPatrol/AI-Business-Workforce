import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Visual Canvasser | YardProof Managed Postcard Campaigns',
  description:
    'See how YardProof creates managed, human-assisted property-concept postcard campaigns for home-service businesses.',
};

export default function VisualCanvasserLayout({ children }: { children: ReactNode }) {
  return children;
}
