import type { EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { safeReturnPath } from '@/lib/auth/return-path';
import { createClient } from '@/lib/supabase/server';

/** Finishes an emailed sign-in link (PKCE code or token hash), then opens the desk. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const next = safeReturnPath(url.searchParams.get('next'));
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  try {
    const supabase = await createClient();
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, url.origin));
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (!error) return NextResponse.redirect(new URL(next, url.origin));
    }
  } catch (error) {
    console.error('Sign-in link could not be completed', error);
  }

  const failed = new URL('/login', url.origin);
  failed.searchParams.set('next', next);
  failed.searchParams.set('error', 'link');
  return NextResponse.redirect(failed);
}
