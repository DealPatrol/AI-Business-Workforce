import { normalizeEmail } from '@/lib/prospector/gates';
import { unsubscribeSecret, verifyUnsubscribeToken } from '@/lib/prospector/unsubscribe-token';
import { createAdminClient } from '@/lib/supabase/admin';

export async function applyUnsubscribe(token: string | undefined | null): Promise<{
  saved: boolean;
  email: string | null;
  serverError?: boolean;
}> {
  const secret = unsubscribeSecret();
  if (token && !secret) {
    console.error(
      'unsubscribe: no PROSPECTOR_UNSUBSCRIBE_SECRET / SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY configured',
    );
    return { saved: false, email: null, serverError: true };
  }
  const verified = token && secret ? verifyUnsubscribeToken(token, secret) : null;
  if (!verified) return { saved: false, email: null };

  try {
    const admin = createAdminClient();
    const email = normalizeEmail(verified.email);
    const { error } = await admin.from('prospector_suppressions').upsert(
      { owner_id: verified.ownerId, email, reason: 'unsubscribe' },
      { onConflict: 'owner_id,email' },
    );
    if (error) {
      console.error('unsubscribe: suppression upsert failed', error);
      return { saved: false, email, serverError: true };
    }
    const { error: leadError } = await admin
      .from('prospector_leads')
      .update({ status: 'do_not_contact', updated_at: new Date().toISOString() })
      .eq('owner_id', verified.ownerId)
      .contains('emails', [email]);
    if (leadError) console.error('unsubscribe: lead status update failed', leadError);
    return { saved: true, email };
  } catch (error) {
    console.error('unsubscribe failed', error);
    return { saved: false, email: verified.email, serverError: true };
  }
}
