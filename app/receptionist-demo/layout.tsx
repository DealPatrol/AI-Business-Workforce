import './receptionist.css';
import './sales-upgrade.css';
import './text-preview.css';
import type { Metadata } from 'next';
import { avaAbsoluteUrl } from '@/lib/site';

const title = 'Try the Ava AI Receptionist Demo';
const description =
  'Hear a prerecorded Ava call or talk to her in the browser, then start a free 7-day Stripe trial. Plans are $79, $149, and $299 a month.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: avaAbsoluteUrl('/receptionist-demo') },
  openGraph: {
    title,
    description,
    url: avaAbsoluteUrl('/receptionist-demo'),
    siteName: 'Ava',
    type: 'website',
  },
};

export default function ReceptionistDemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
