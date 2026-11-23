import { ErDemoBar, ErLinkColumns } from '@/components/er/ErSite';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { BlogSite } from '@/lib/blog';
import { SisterSites } from '@/components/seo/SisterSites';

export function BlogChrome({ site, children }: { site: BlogSite; children: ReactNode }) {
  const er = site === 'er';
  return (
    <div className="blog-page">
      {er ? <ErDemoBar /> : null}
      <nav className="blog-nav" aria-label="Main">
        <Link className="blog-brand" href="/">
          {er ? 'Executive Receptionist' : 'Front Porch Growth'}
        </Link>
        <div className="blog-nav-links">
          <Link href="/blog">Blog</Link>
          {er ? (<><Link href="/hvac">HVAC</Link><Link href="/ava/ai-answering-service-for-plumbers">Plumbing</Link></>) : <Link href="/ai-visibility">Free grader</Link>}
          <Link href="/pricing">Pricing</Link>
          {er ? (
            <a className="blog-nav-cta" href="/hvac?utm_source=blog&utm_medium=nav&utm_campaign=blog">
              Start for $1
            </a>
          ) : (
            <a className="blog-nav-cta" href="/ai-visibility?utm_source=blog&utm_medium=nav&utm_campaign=blog">
              Grade my site free
            </a>
          )}
        </div>
      </nav>
      {children}
      {er ? <ErLinkColumns /> : null}
      <footer className="blog-footer">
        <p>
          <Link href="/">Home</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </p>
        <p>{er ? 'Executive Receptionist' : 'Front Porch Growth'} · Cole Collins</p>
        <SisterSites
          selfUrl={er ? 'https://executivereceptionist.com' : 'https://frontporchgrowth.com'}
          clusters={er ? ['home-services', 'phone'] : ['home-services', 'reviews']}
        />
      </footer>
    </div>
  );
}
