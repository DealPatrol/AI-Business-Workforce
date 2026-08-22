import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workforce AI | AI Employees for Local Business',
  description: 'Deploy an AI workforce that finds leads, follows up, books work, and automates repetitive business tasks.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
