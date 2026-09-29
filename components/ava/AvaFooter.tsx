import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function AvaFooter() {
  return (
    <footer className="sales-footer">
      <Link className="ava-brand" href="/ava">
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
