import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlogBody } from '@/components/blog/BlogBody';
import { BlogChrome } from '@/components/blog/BlogChrome';
import { JsonLd } from '@/components/ava/JsonLd';
import { BLOG_POSTS, blogOrigin, blogPostUrl, blogSlugs, brandForSite, getBlogPost, readingMinutes } from '@/lib/blog';
import '../blog.css';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return blogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Post not found', robots: { index: false, follow: false } };
  const url = blogPostUrl(post);
  return {
    title: { absolute: post.metaTitle },
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: brandForSite(post.site),
      type: 'article',
      publishedTime: post.published,
      authors: ['Cole Collins'],
      tags: post.tags,
      images: ['/og-default.png'],
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.description, images: ['/og-default.png'] },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const url = blogPostUrl(post);
  const origin = blogOrigin(post.site);
  const brand = brandForSite(post.site);
  const related = BLOG_POSTS.filter((item) => item.slug !== post.slug && item.site === post.site);
  return (
    <BlogChrome site={post.site}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              headline: post.title,
              description: post.description,
              datePublished: post.published,
              dateModified: post.published,
              inLanguage: 'en-US',
              wordCount: post.words,
              keywords: post.tags.join(', '),
              mainEntityOfPage: url,
              url,
              image: `${origin}/og-default.png`,
              author: { '@type': 'Person', name: 'Cole Collins' },
              publisher: { '@type': 'Organization', name: brand, url: `${origin}/` },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: brand, item: `${origin}/` },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: `${origin}/blog` },
                { '@type': 'ListItem', position: 3, name: post.title, item: url },
              ],
            },
          ],
        }}
      />
      <main className="blog-main">
        <Link className="blog-kicker" href="/blog">
          ← Blog
        </Link>
        <h1>{post.title}</h1>
        <p className="blog-meta">
          By Cole Collins · {post.published} · {readingMinutes(post)} min read
        </p>
        <article className="blog-article">
          <BlogBody blocks={post.blocks} />
        </article>
        <aside className="blog-cta">
          <h2>{post.site === 'er' ? 'Hear Ava answer a no-heat call' : 'See where your business stands'}</h2>
          <p>
            {post.site === 'er'
              ? 'Starter is $1 for the first month, then $79/month for 100 minutes. Month to month, cancel anytime.'
              : 'Free, about 15 seconds, no card. Real checks only, and no ranking promises.'}
          </p>
          <a className="blog-cta-btn" href={post.ctaUrl}>
            {post.ctaLabel}
          </a>
        </aside>
        {related.length > 0 ? (
          <section className="blog-related">
            <h2>Keep reading</h2>
            <ul>
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                </li>
              ))}
              <li>
                <Link href="/blog">All articles</Link>
              </li>
            </ul>
          </section>
        ) : null}
      </main>
    </BlogChrome>
  );
}
