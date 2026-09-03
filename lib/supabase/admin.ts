import { createClient } from '@supabase/supabase-js';
import { createClient as createUserClient } from '@/lib/supabase/server';

/**
 * Prefer the server secret so sales events persist even when RLS blocks the
 * publishable key. Fall back to the cookie/SSR client when only the public
 * key is configured (migration 004 adds insert/select policies for that path).
 */
export async function createSalesClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && secret) {
    return createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return createUserClient();
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
}
