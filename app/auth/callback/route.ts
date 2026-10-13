import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED = new Set(['/dashboard/ava', '/dashboard/reviews', '/referrals', '/dashboard/campaigns']);

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const next = req.nextUrl.searchParams.get('next') || '/dashboard/ava';
  const target = ALLOWED.has(next) ? next : '/dashboard/ava';
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL('/login?error=link', req.url));
  }
  return NextResponse.redirect(new URL(target, req.url));
}
