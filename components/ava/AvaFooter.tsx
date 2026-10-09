import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function AvaFooter({ homeHref = '/ava' }: { homeHref?: string }) {
  return (
    <footer className="sales-footer">
      <Link className="ava-brand" href={homeHref}>
        <span>
          <Sparkles size={17} />
        </span>{' '}
        Ava
      </Link>
      <p>Ava by Workforce AI · DealPatrol</p>
      <Link className="footer-privacy" href="/privacy">
        Privacy
      </Link>
    </footer>
  );
}
