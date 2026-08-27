import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const escapeHtml=(value:unknown)=>String(value??'Not provided').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]||c));

async function notifyLead(lead:any){
  const apiKey=process.env.RESEND_API_KEY;
  const to=process.env.AVA_LEAD_NOTIFICATION_EMAIL;
  if(!apiKey||!to) return { sent:false, error:'Email notification environment variables are not configured.' };
  const subject=`New Ava lead${lead.caller_name?` — ${lead.caller_name}`:''}${lead.service_job_type?` — ${lead.service_job_type}`:''}`;
  const html=`<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#17211b"><h1 style="font-size:24px">New Ava lead</h1><p>Ava finished a call and captured the following lead.</p><table style="border-collapse:collapse;width:100%"><tr><td><b>Name</b></td><td>${escapeHtml(lead.caller_name)}</td></tr><tr><td><b>Phone</b></td><td>${escapeHtml(lead.caller_phone)}</td></tr><tr><td><b>Service / job</b></td><td>${escapeHtml(lead.service_job_type)}</td></tr><tr><td><b>Address</b></td><td>${escapeHtml(lead.property_address)}</td></tr><tr><td><b>Intent / urgency</b></td><td>${escapeHtml(lead.intent_urgency)}</td></tr><tr><td><b>Business</b></td><td>${escapeHtml(lead.business_name)} (${escapeHtml(lead.business_type)})</td></tr></table><h2 style="font-size:18px;margin-top:24px">Conversation summary</h2><p style="white-space:pre-wrap">${escapeHtml(lead.summary)}</p><p style="font-size:12px;color:#66736b">Conversation ID: ${escapeHtml(lead.conversation_id)}</p></div>`;
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from:'Workforce AI <onboarding@resend.dev>',to:[to],subject,html})});
  const result=await response.json().catch(()=>({}));
  if(!response.ok) return { sent:false, error:result?.message||`Resend returned ${response.status}` };
  return { sent:true, id:result?.id };
}

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

    // Only notify once per saved call. This protects against browser/API retries creating duplicate alerts.
    let notification={ sent:Boolean(data.notified_at), skipped:Boolean(data.notified_at) } as any;
    if(!data.notified_at){
      notification=await notifyLead(data);
      if(notification.sent){
        const notifiedAt=new Date().toISOString();
        const { error:updateError }=await supabase.from('ava_call_leads').update({notified_at:notifiedAt}).eq('id',data.id);
        if(updateError) notification.warning='Email sent, but notified_at could not be saved.';
        else data.notified_at=notifiedAt;
      }
    }
    return NextResponse.json({ lead: data, notification });
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
