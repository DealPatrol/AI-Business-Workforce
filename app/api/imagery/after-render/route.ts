import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Disabled (YardProof change approved by Cole, 2026-10-13).
 * Before/after postcards now use the client's own uploaded job photos:
 * POST /api/imagery/crew-photo with slot=before and slot=after.
 * AI-generated "after" images and Google Street View / Static Maps imagery
 * are no longer used for printed postcards.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        'AI after-render is disabled. Upload your own BEFORE and AFTER job photos via POST /api/imagery/crew-photo (slot=before|after, rightsConfirmed=true).',
    },
    { status: 410 },
  );
}
