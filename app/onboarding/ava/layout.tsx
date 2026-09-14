import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Ava Paid Pilot Onboarding | YardProof',
  description: 'Share the business details Cole needs to configure and test your Ava receptionist.',
};

export default function AvaOnboardingLayout({ children }: { children: ReactNode }) {
  return children;
}
