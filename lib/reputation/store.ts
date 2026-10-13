import { createAdminClient } from '@/lib/supabase/admin';
import { OPERATOR_EMAIL } from '@/lib/ava/client-access';
import { escapeHtml } from '@/lib/ava/mail';

export type RfBusiness = {
  id: string;
  owner_email: string;
  name: string;
  slug: string;
  google_review_url: string | null;
  facebook_url: string | null;
  yelp_url: string | null;
  reply_tone: string | null;
};

export function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'business';
}

export function siteOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://frontporchgrowth.com').replace(/\/$/, '');
}

export function reviewPageUrl(slug: string, requestId?: string) {
  return `${siteOrigin()}/r/${slug}${requestId ? `?q=${requestId}` : ''}`;
}

export async function businessesFor(email: string): Promise<RfBusiness[]> {
  const admin = createAdminClient();
  const query = admin.from('rf_businesses').select('*').order('created_at', { ascending: false });
  const { data } = email === OPERATOR_EMAIL ? await query.limit(50) : await query.ilike('owner_email', email).limit(10);
  return (data ?? []) as RfBusiness[];
}

export async function ownedBusiness(email: string, id: string) {
  return (await businessesFor(email)).find((row) => row.id === id) || null;
}

export async function businessBySlug(slug: string) {
  const { data } = await createAdminClient().from('rf_businesses').select('*').eq('slug', slug).maybeSingle();
  return (data as RfBusiness) || null;
}

export function requestEmailHtml(business: RfBusiness, customerName: string, link: string, reminder = false) {
  const hi = customerName ? `Hi ${escapeHtml(customerName)},` : 'Hi,';
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17211b"><p>${hi}</p><p>${reminder ? 'Just a quick reminder — ' : ''}Thanks for choosing ${escapeHtml(business.name)}. Would you take a minute to share how it went?</p><p><a href="${link}" style="display:inline-block;background:#1f6f43;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Leave a review</a></p><p>Thank you!<br>${escapeHtml(business.name)}</p></div>`;
}

export function requestSmsBody(business: RfBusiness, customerName: string, link: string, reminder = false) {
  return `${customerName ? `Hi ${customerName}, ` : ''}${reminder ? 'quick reminder from' : 'thanks for choosing'} ${business.name}! Would you share how it went? ${link}`.slice(0, 300);
}
