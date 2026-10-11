import { extractContactNames, extractEmails, pickContactLinks } from '@/lib/prospector/email-extract';
import { fetchPublicHtml } from '@/lib/prospector/safe-fetch';

export type EnrichmentResult = {
  emails: string[];
  contactName: string | null;
  ok: boolean;
};

export async function enrichWebsite(website: string): Promise<EnrichmentResult> {
  try {
    const home = await fetchPublicHtml(website);
    const pages = [home.html];
    for (const link of pickContactLinks(home.html, home.finalUrl, 2)) {
      try {
        const page = await fetchPublicHtml(link);
        pages.push(page.html);
      } catch {
        /* A missing contact page should not fail the homepage result. */
      }
    }
    const html = pages.join('\n');
    const emails = extractEmails(html);
    const names = extractContactNames(html);
    return { emails, contactName: names[0] ?? null, ok: true };
  } catch {
    return { emails: [], contactName: null, ok: false };
  }
}
