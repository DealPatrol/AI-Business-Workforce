import './receptionist.css';
import './sales-upgrade.css';
import './text-preview.css';
import type { Metadata } from 'next';

const title = 'Try the Front Porch Dispatch AI Receptionist Demo';
const description =
  'Hear a prerecorded Front Porch Dispatch call or talk to it in the browser, then start a free 7-day Stripe trial. Plans are $79, $149, and $299 a month.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/receptionist-demo' },
  openGraph: {
    title,
    description,
    url: '/receptionist-demo',
    siteName: 'Front Porch Dispatch',
    type: 'website',
  },
};

export default function ReceptionistDemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
