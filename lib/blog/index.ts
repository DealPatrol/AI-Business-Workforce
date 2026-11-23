import type { BlogPost, BlogSite } from '@/lib/blog/posts';
import { BLOG_POSTS } from '@/lib/blog/all-posts';
import { absoluteUrl, EXECUTIVE_RECEPTIONIST_ORIGIN, isExecutiveReceptionistHost } from '@/lib/site-url';

export { BLOG_POSTS };
export type { BlogPost, BlogSite };

export const FRONT_PORCH_ORIGIN = 'https://frontporchgrowth.com';

export const BLOG_INDEX_SEO = {
  title: 'Blog: Calls, Search, and AI Answers for Local Shops',
  description:
    'Plain guides for home-service owners: after-hours calls, AI receptionists, and showing up in Google and ChatGPT answers. No fluff, no ranking promises.',
};

export function blogSlugs() {
  return BLOG_POSTS.map((post) => post.slug);
}

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

/** The one public home of each article. Receptionist articles live on executivereceptionist.com. */
export function blogOrigin(site: BlogSite) {
  return site === 'er' ? EXECUTIVE_RECEPTIONIST_ORIGIN : FRONT_PORCH_ORIGIN;
}

export function blogPostUrl(post: Pick<BlogPost, 'site' | 'slug'>) {
  return absoluteUrl(blogOrigin(post.site), `/blog/${post.slug}`);
}

/** Executive Receptionist host lists only its own articles. Front Porch Growth lists all of them. */
export function blogPostsForHost(hostHeader: string | null | undefined) {
  if (isExecutiveReceptionistHost(hostHeader)) return BLOG_POSTS.filter((post) => post.site === 'er');
  return BLOG_POSTS;
}

export function blogPostsForSite(site: BlogSite) {
  return BLOG_POSTS.filter((post) => post.site === site);
}

export function brandForSite(site: BlogSite) {
  return site === 'er' ? 'Executive Receptionist' : 'Front Porch Growth';
}

export function readingMinutes(post: Pick<BlogPost, 'words'>) {
  return Math.max(1, Math.round(post.words / 220));
}
