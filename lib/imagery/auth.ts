import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export type OwnerContext = {
  userId: string;
  admin: ReturnType<typeof createAdminClient>;
};

/** Require an authenticated session; use admin client for storage + writes after ownership check. */
export async function requireCampaignOwner(): Promise<
  | { ok: true; ctx: OwnerContext }
  | { ok: false; response: NextResponse }
> {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Sign in required.' }, { status: 401 }),
      };
    }

    return {
      ok: true,
      ctx: { userId: authData.user.id, admin: createAdminClient() },
    };
  } catch (error) {
    console.error('imagery auth error', error);
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Auth or Supabase is not configured.' },
        { status: 503 },
      ),
    };
  }
}

export async function assertRecipientOwned(
  ctx: OwnerContext,
  recipientId: string,
): Promise<
  | {
      ok: true;
      recipient: {
        id: string;
        campaign_id: string;
        address_line_1: string;
        address_line_2: string | null;
        city: string;
        state: string;
        postal_code: string;
        public_token: string;
        current_image_url: string | null;
        current_image_source: string | null;
        after_image_url: string | null;
        review_status: string;
        latitude: number | null;
        longitude: number | null;
        normalized_address: string | null;
        street_view_pano_id: string | null;
        concept_json: Record<string, unknown> | null;
      };
    }
  | { ok: false; response: NextResponse }
> {
  if (!isUuid(recipientId)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'A valid recipientId is required.' }, { status: 400 }),
    };
  }

  const { data, error } = await ctx.admin
    .from('campaign_recipients')
    .select(
      `
      id,
      campaign_id,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      public_token,
      current_image_url,
      current_image_source,
      after_image_url,
      review_status,
      latitude,
      longitude,
      normalized_address,
      street_view_pano_id,
      concept_json,
      campaigns!inner ( owner_id )
    `,
    )
    .eq('id', recipientId)
    .single();

  if (error || !data) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Recipient not found.' }, { status: 404 }),
    };
  }

  const joined = data.campaigns as unknown;
  const campaignRow = Array.isArray(joined) ? joined[0] : joined;
  const ownerId =
    campaignRow && typeof campaignRow === 'object' && 'owner_id' in campaignRow
      ? String((campaignRow as { owner_id: string }).owner_id)
      : null;

  if (!ownerId || ownerId !== ctx.userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Recipient not found.' }, { status: 404 }),
    };
  }

  const row = data as Record<string, unknown>;
  return {
    ok: true,
    recipient: {
      id: String(row.id),
      campaign_id: String(row.campaign_id),
      address_line_1: String(row.address_line_1),
      address_line_2: (row.address_line_2 as string | null) ?? null,
      city: String(row.city),
      state: String(row.state),
      postal_code: String(row.postal_code),
      public_token: String(row.public_token),
      current_image_url: (row.current_image_url as string | null) ?? null,
      current_image_source: (row.current_image_source as string | null) ?? null,
      after_image_url: (row.after_image_url as string | null) ?? null,
      review_status: String(row.review_status ?? 'pending'),
      latitude: (row.latitude as number | null) ?? null,
      longitude: (row.longitude as number | null) ?? null,
      normalized_address: (row.normalized_address as string | null) ?? null,
      street_view_pano_id: (row.street_view_pano_id as string | null) ?? null,
      concept_json: (row.concept_json as Record<string, unknown> | null) ?? null,
    },
  };
}

export function parseJsonBody(request: NextRequest): Promise<Record<string, unknown>> {
  return request.json().catch(() => ({}));
}

export function imageryBucket(): string {
  return process.env.IMAGERY_STORAGE_BUCKET?.trim() || 'yardproof-imagery';
}
