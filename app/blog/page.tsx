import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogChrome } from '@/components/blog/BlogChrome';
import { JsonLd } from '@/components/ava/JsonLd';
import { BLOG_INDEX_SEO, blogPostUrl, blogPostsForHost, readingMinutes } from '@/lib/blog';
import { requestHost } from '@/lib/seo/request-host';
import { urlsForRequest } from '@/lib/seo/host-metadata';
import { absoluteSiteUrl, isExecutiveReceptionistHost } from '@/lib/site-url';
import './blog.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const fallback = absoluteSiteUrl('/blog');
  const { canonical, openGraphUrl } = await urlsForRequest('/blog', fallback, fallback);
  return {
    title: { absolute: BLOG_INDEX_SEO.title },
    description: BLOG_INDEX_SEO.description,
    alternates: { canonical },
    openGraph: {
      title: BLOG_INDEX_SEO.title,
      description: BLOG_INDEX_SEO.description,
      url: openGraphUrl,
      type: 'website',
      images: ['/og-default.png'],
    },
    twitter: { card: 'summary_large_image', title: BLOG_INDEX_SEO.title, description: BLOG_INDEX_SEO.description, images: ['/og-default.png'] },
  };
}

export default async function BlogIndexPage() {
  const host = await requestHost();
  const er = isExecutiveReceptionistHost(host);
  const posts = blogPostsForHost(host);
  return (
    <BlogChrome site={er ? 'er' : 'fpg'}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: er ? 'Executive Receptionist Blog' : 'Front Porch Growth Blog',
          description: BLOG_INDEX_SEO.description,
          blogPost: posts.map((post) => ({
            '@type': 'BlogPosting',
            headline: post.title,
            url: blogPostUrl(post),
            datePublished: post.published,
          })),
        }}
      />
      <main className="blog-main wide">
        <span className="blog-kicker">Blog</span>
        <h1>{er ? 'Answer every call. Win the job.' : 'Get found, get called, win the job.'}</h1>
        <p className="blog-lede">
          Plain, practical guides for home-service owners. Written by Cole Collins. No fluff, no made-up numbers, and no ranking promises.
        </p>
        <div className="blog-grid">
          {posts.map((post) => (
            <Link key={post.slug} className="blog-card" href={`/blog/${post.slug}`}>
              <small>
                {post.published} · {readingMinutes(post)} min read
              </small>
              <h2>{post.title}</h2>
              <p>{post.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </BlogChrome>
  );
}
