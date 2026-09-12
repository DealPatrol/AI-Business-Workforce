import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://ai-business-workforce.vercel.app';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/ava`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/receptionist-demo`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];
}
