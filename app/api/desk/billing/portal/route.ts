import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession } from '@/lib/desk/stripe';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Return to the same domain the owner signed in on (executivereceptionist.com or a preview). */
function siteOrigin(request: NextRequest) {
  return request.nextUrl.origin;
}

/** Sends a signed-in owner to their Stripe billing portal, or to /pricing if they have no billing yet. */
export async function POST(request: NextRequest) {
  const origin = siteOrigin(request);
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.redirect(new URL('/login?next=/desk', origin), 303);

  // RLS returns only the signed-in owner's own customer row.
  const { data } = await supabase.from('ava_customers').select('stripe_customer_id').limit(1).maybeSingle();
  const url = await createPortalSession(data?.stripe_customer_id, `${origin}/desk#billing`);
  return NextResponse.redirect(url || new URL('/pricing', origin), 303);
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/desk#billing', siteOrigin(request)), 303);
}
