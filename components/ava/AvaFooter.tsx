import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { SisterSites } from '@/components/seo/SisterSites';
import { ErFooterColumns } from '@/components/er/ErSite';

export function AvaFooter({ homeHref = '/' }: { homeHref?: string }) {
  return (
    <footer className="sales-footer">
      <Link className="ava-brand" href={homeHref}>
        <span>
          <Sparkles size={17} />
        </span>{' '}
        Executive Receptionist
      </Link>
      <p>Operated by Cole Collins DBA Executive Receptionist, Hanceville, AL.</p>
      <ErFooterColumns className="er-footer-cols" />
      <nav className="footer-links" aria-label="Executive Receptionist">
        <Link href={homeHref}>Home</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/sms">SMS terms</Link>
        <Link href="/sms-consent">SMS consent</Link>
        <Link href="/about">About</Link>
      </nav>
      <SisterSites selfUrl="https://executivereceptionist.com" clusters={['home-services', 'phone']} />
    </footer>
  );
}
