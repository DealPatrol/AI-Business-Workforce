import { notFound } from 'next/navigation';
import { businessBySlug } from '@/lib/reputation/store';
import ReviewPanel from './review-panel';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false } };

export default async function ReviewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> }) {
  const { slug } = await params;
  const { q } = await searchParams;
  const business = await businessBySlug(slug);
  if (!business) notFound();
  const links = [
    { label: 'Google', url: business.google_review_url },
    { label: 'Facebook', url: business.facebook_url },
    { label: 'Yelp', url: business.yelp_url },
  ].filter((link): link is { label: string; url: string } => Boolean(link.url));
  return (
    <main style={{ maxWidth: 480, margin: '40px auto', padding: 20, fontFamily: 'system-ui', textAlign: 'center', color: '#17211b' }}>
      <h1>How was your experience with {business.name}?</h1>
      <p>Your review helps neighbors find a good local business. Pick a site:</p>
      {links.map((link) => (
        <a key={link.label} href={link.url} rel="noopener" style={{ display: 'block', margin: '10px 0', padding: 14, borderRadius: 10, background: '#1f6f43', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
          Leave a {link.label} review
        </a>
      ))}
      <ReviewPanel slug={business.slug} requestId={q || ''} />
      <p style={{ fontSize: 12, color: '#5b6b61', marginTop: 30 }}>Every customer sees the same review links, whatever they think of the job. Powered by ReputationFlow.</p>
    </main>
  );
}
