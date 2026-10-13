import type { Metadata } from 'next';
import Link from 'next/link';
import CampaignBuilder from './builder';

export const metadata: Metadata = {
  title: { absolute: 'Campaign builder | YardProof' },
  description: 'Pick the homes near your finished jobs using property records, then mail before/after postcards with your own job photos.',
  robots: { index: false },
};

export default function Page() {
  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '32px 20px', fontFamily: 'inherit', background: '#f7f5ef', minHeight: '100vh' }}>
      <Link href="/postcards">← YardProof</Link>
      <h1 style={{ marginBottom: 4 }}>Build a neighbor campaign</h1>
      <p style={{ marginTop: 0, color: '#444' }}>
        Choose a ZIP or a radius around a job you just finished, then narrow it down with property records:
        home age, lot size, owner-occupied, and recent sales. Your postcard uses your own before and after photos.
      </p>
      <CampaignBuilder />
    </main>
  );
}
