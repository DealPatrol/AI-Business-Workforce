import { NextRequest, NextResponse } from 'next/server';
import { ownerCanAccessLead } from '@/lib/leads/access';
import { clientIdsForOwnerEmail, getLead } from '@/lib/leads/store';
import { UUID_PATTERN } from '@/lib/leads/types';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const CONVERSATION_ID = /^[A-Za-z0-9_-]{6,120}$/;

/**
 * Streams a call recording to the signed-in owner of the lead or call (er_leads or ava_call_leads id). The browser never sees the
 * ElevenLabs key or the conversation id lookup; anyone else gets a 404.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  try {
    const [lead, clientIds] = await Promise.all([getLead(id), clientIdsForOwnerEmail(user.email ?? '')]);
    let conversationId = '';
    if (lead && ownerCanAccessLead(lead, user.id, clientIds)) {
      conversationId = lead.conversation_id?.trim() || '';
    } else {
      // Call-history rows: row-level security returns the call only to its owner.
      const { data: call } = await supabase.from('ava_call_leads').select('conversation_id').eq('id', id).maybeSingle();
      if (!call) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
      conversationId = String(call.conversation_id ?? '').trim();
    }
    if (!CONVERSATION_ID.test(conversationId)) {
      return NextResponse.json({ error: 'No recording for this call.' }, { status: 404 });
    }
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: 'Recordings are not configured.' }, { status: 503 });

    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${encodeURIComponent(conversationId)}/audio`,
      { headers: { 'xi-api-key': apiKey }, cache: 'no-store' },
    );
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'The recording is not available.' }, { status: upstream.status === 404 ? 404 : 502 });
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'audio/mpeg',
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `inline; filename="call-${id}.mp3"`,
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error) {
    console.error('Unable to stream call recording', error);
    return NextResponse.json({ error: 'The recording is not available right now.' }, { status: 503 });
  }
}
