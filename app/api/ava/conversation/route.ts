import { NextRequest, NextResponse } from 'next/server';

const API = 'https://api.elevenlabs.io/v1';
const valueOf = (item:any) => item?.value ?? item?.result ?? item?.data ?? item?.extracted_value ?? null;

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get('conversationId');
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!conversationId) return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: 'ELEVENLABS_API_KEY is not configured' }, { status: 500 });
  try {
    const response = await fetch(`${API}/convai/conversations/${encodeURIComponent(conversationId)}`, { headers: { 'xi-api-key': apiKey }, cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: 'Unable to retrieve ElevenLabs conversation', details: data }, { status: response.status });
    if (data.status !== 'done') return NextResponse.json({ ready: false, status: data.status }, { status: 202 });
    const collected = data.analysis?.data_collection_results || {};
    const pick = (...keys:string[]) => { for (const key of keys) { const direct=valueOf(collected[key]); if(direct) return direct; const found=Object.entries(collected).find(([k])=>k.toLowerCase().replace(/[^a-z0-9]/g,'').includes(key.toLowerCase().replace(/[^a-z0-9]/g,''))); const v=valueOf(found?.[1]); if(v) return v; } return null; };
    const transcript=(data.transcript||[]).map((m:any)=>({role:m.role,message:m.message,timeInCallSecs:m.time_in_call_secs}));
    return NextResponse.json({ ready:true, conversationId:data.conversation_id, summary:data.analysis?.transcript_summary || data.analysis?.call_summary_title || 'Completed Ava conversation', transcript, lead:{ name:pick('caller_name','name'), phone:pick('caller_phone','phone'), serviceJobType:pick('service_job_type','service','job_type'), address:pick('property_address','address'), intentUrgency:pick('intent_urgency','urgency','intent') } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to process conversation' }, { status: 500 }); }
}
