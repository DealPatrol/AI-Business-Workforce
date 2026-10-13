import { randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export const REFERRAL_COOKIE = 'fpg_ref';

export function sanitizeReferralCode(value: unknown) {
  const code = String(value || '').trim().toUpperCase();
  return /^[A-Z0-9]{4,16}$/.test(code) ? code : '';
}

export async function getOrCreateReferralCode(email: string, name?: string) {
  const admin = createAdminClient();
  const existing = await admin.from('referral_codes').select('code').ilike('owner_email', email).maybeSingle();
  if (existing.data?.code) return existing.data.code as string;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = randomBytes(5).toString('base64').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    if (code.length < 4) continue;
    const { error } = await admin.from('referral_codes').insert({ code, owner_email: email.toLowerCase(), owner_name: name || null });
    if (!error) return code;
  }
  throw new Error('Could not create a referral code.');
}

export async function recordReferralEvent(code: string, event: 'visit' | 'checkout_started' | 'subscribed', extra: { stripe_session_id?: string; product?: string } = {}) {
  const clean = sanitizeReferralCode(code);
  if (!clean) return;
  try {
    await createAdminClient().from('referral_events').insert({ code: clean, event, ...extra });
  } catch (error) {
    console.error('referral event not recorded', error);
  }
}

export async function referralStats(code: string) {
  const { data } = await createAdminClient().from('referral_events').select('event').eq('code', code);
  const counts = { visit: 0, checkout_started: 0, subscribed: 0, credited: 0 } as Record<string, number>;
  for (const row of data ?? []) counts[(row as { event: string }).event] = (counts[(row as { event: string }).event] || 0) + 1;
  return counts;
}
