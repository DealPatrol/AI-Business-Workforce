import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const PROSPECT_GATE_COOKIE = 'fpg_prospect_gate';

export function prospectGateToken(secret: string) {
  return createHmac('sha256', secret).update('front-porch-prospect-gate-v1').digest('hex');
}

function sameToken(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Supabase login when it is configured; otherwise the PROSPECT_GATE_PASSWORD cookie. */
export async function gateProspectPage(nextPath: string): Promise<'allow' | 'password' | 'locked'> {
  await connection();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (url && key) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
    return 'allow';
  }

  const secret = process.env.PROSPECT_GATE_PASSWORD?.trim();
  if (!secret) return 'locked';
  const jar = await cookies();
  const cookie = jar.get(PROSPECT_GATE_COOKIE)?.value ?? '';
  if (cookie && sameToken(cookie, prospectGateToken(secret))) return 'allow';
  return 'password';
}
