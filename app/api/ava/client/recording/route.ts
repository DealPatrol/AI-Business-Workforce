import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessOnboarding, currentUserEmail } from '@/lib/ava/client-access';

export const dynamic = 'force-dynamic';

/** Streams the ElevenLabs call recording after checking the lead belongs to the signed-in client. */
export async function GET(req: NextRequest) {
  const email = await currentUserEmail();
  if (!email) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const leadId = req.nextUrl.searchParams.get('lead') || '';
  const { data: lead } = await createAdminClient()
    .from('ava_call_leads')
    .select('conversation_id, onboarding_id')
    .eq('id', leadId)
    .maybeSingle();
  if (!lead?.conversation_id || !lead.onboarding_id || !(await canAccessOnboarding(email, lead.onboarding_id))) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: 'Recording service not configured.' }, { status: 503 });
  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${encodeURIComponent(lead.conversation_id)}/audio`,
    { headers: { 'xi-api-key': apiKey }, cache: 'no-store' },
  );
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Recording not available (it may have expired under ElevenLabs retention).' }, { status: 404 });
  }
  return new NextResponse(upstream.body, {
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'audio/mpeg', 'Cache-Control': 'private, no-store' },
  });
}
