import '../receptionist-demo/receptionist.css';
import '../receptionist-demo/sales-upgrade.css';
import '../receptionist-demo/text-preview.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Ava AI Receptionist for Alabama Home Services | Workforce AI',
  description:
    'A managed, done-for-you AI receptionist for Alabama and Southeast home-service teams. Test Ava live, hear a sample call, and launch with human setup.',
};

export default function AvaLayout({ children }: { children: ReactNode }) {
  return children;
}
