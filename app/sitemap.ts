import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://ai-business-workforce.vercel.app';
  const now = new Date();
  const avaPages = [
    'ai-receptionist-hvac-companies',
    'ai-receptionist-plumbers',
    'ai-receptionist-roofers',
    'ai-receptionist-landscapers',
    'ai-answering-service-contractors',
    'missed-call-answering-home-services',
  ];
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/ava`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/receptionist-demo`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ...avaPages.map((slug) => ({
      url: `${base}/ava/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.88,
    })),
  ];
}
