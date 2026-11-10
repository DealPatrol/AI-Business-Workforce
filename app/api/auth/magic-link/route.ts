import { NextRequest, NextResponse } from 'next/server';
import { safeReturnPath } from '@/lib/auth/return-path';
import { clientIdsForOwnerEmail } from '@/lib/leads/store';
import { createRateLimiter } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

const take = createRateLimiter(5, 10 * 60 * 1000);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC = 'If that email belongs to a customer, a sign-in link is on its way. Check your inbox and spam folder.';

function clientKey(req: NextRequest) {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'unknown';
}

/**
 * Emails a one-time sign-in link. Only buyers (an ava_customers row with this email)
 * get an account created; anyone else only gets a link if a login already exists.
 * The reply never says which happened.
 */
export async function POST(req: NextRequest) {
  const limit = take(clientKey(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a few minutes.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    );
  }

  const body = (await req.json().catch(() => null)) as { email?: unknown; next?: unknown } | null;
  const email = String(body?.email ?? '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  const next = safeReturnPath(typeof body?.next === 'string' ? body.next : null);

  let isCustomer = false;
  try {
    isCustomer = (await clientIdsForOwnerEmail(email)).length > 0;
  } catch (error) {
    console.error('Customer lookup for sign-in link failed', error);
  }

  try {
    const supabase = await createClient();
    const emailRedirectTo = `${req.nextUrl.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: isCustomer, emailRedirectTo },
    });
    if (error && isCustomer) console.error('Sign-in link could not be sent', error.message);
  } catch (error) {
    console.error('Sign-in link request failed', error);
  }

  return NextResponse.json({ message: GENERIC });
}
