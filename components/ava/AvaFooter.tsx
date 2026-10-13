import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function AvaFooter({ homeHref = '/receptionist' }: { homeHref?: string }) {
  return (
    <footer className="sales-footer">
      <Link className="ava-brand" href={homeHref}>
        <span>
          <Sparkles size={17} />
        </span>{' '}
        Executive Receptionist
      </Link>
      <p>Part of Front Porch Growth. Operated by DealPatrol.</p>
      <nav className="footer-links" aria-label="Executive Receptionist">
        <Link href="/">Front Porch Growth</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
      </nav>
    </footer>
  );
}
