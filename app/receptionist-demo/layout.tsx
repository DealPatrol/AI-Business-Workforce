import './receptionist.css';
import './sales-upgrade.css';
import './text-preview.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ava AI Receptionist for Alabama Home Services | YardProof',
  description:
    'A managed, done-for-you AI receptionist for Alabama and Southeast home-service teams. Test Ava live, hear a sample call, and launch with human setup.',
};

export default function ReceptionistDemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
