import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { InstallDesk } from './install-desk';

export const metadata: Metadata = {
  manifest: '/desk.webmanifest',
  appleWebApp: { capable: true, title: 'Ava Desk', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/desk-app/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/desk-app/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#14201a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function DeskLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <InstallDesk />
    </>
  );
}
