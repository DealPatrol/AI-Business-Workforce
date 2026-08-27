import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.summary) return NextResponse.json({ error: 'summary is required' }, { status: 400 });
    const supabase = await createClient();
    const payload = {
      conversation_id: body.conversationId || null,
      business_name: body.businessName || null,
      business_type: body.businessType || null,
      caller_name: body.name || null,
      caller_phone: body.phone || null,
      service_job_type: body.serviceJobType || null,
      property_address: body.address || null,
      intent_urgency: body.intentUrgency || null,
      summary: body.summary,
      transcript: Array.isArray(body.transcript) ? body.transcript : [],
    };
    const { data, error } = await supabase.from('ava_call_leads').upsert(payload, { onConflict: 'conversation_id' }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ lead: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save lead' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('ava_call_leads').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ leads: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load leads' }, { status: 500 });
  }
}
