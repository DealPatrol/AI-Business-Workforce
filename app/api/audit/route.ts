import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.businessType || !body?.goal) {
      return NextResponse.json({ error: 'Business type and goal are required.' }, { status: 400 });
    }

    const fallback = {
      summary: `A focused AI workforce for a ${body.businessType} business prioritizing ${body.goal}.`,
      agents: ['Lead Machine', 'Follow-Up Machine', 'AI Receptionist'],
      firstAutomation: 'Capture every inbound lead, respond immediately, qualify the opportunity, and keep following up until the prospect books or opts out.',
      expectedOutcome: 'Faster response time, fewer lost leads, and a measurable pipeline of opportunities.',
      pilot: 'Start with one revenue-linked workflow, measure it for 30 days, then add the next automation.'
    };

    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ recommendation: fallback, mode: 'fallback' });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: process.env.OPENAI_AUDIT_MODEL || 'gpt-5-mini',
      input: `You are designing an AI workforce for a small business. Return concise JSON only with keys summary (string), agents (array of 3-5 strings), firstAutomation (string), expectedOutcome (string), pilot (string). Do not promise guaranteed revenue. Business type: ${body.businessType}. Goal: ${body.goal}. Service area: ${body.serviceArea || 'not provided'}. Pain points: ${(body.painPoints || []).join(', ') || 'not provided'}. Budget: ${body.budget || 'not provided'}.`,
      text: { format: { type: 'json_object' } }
    });

    const recommendation = JSON.parse(response.output_text || JSON.stringify(fallback));
    return NextResponse.json({ recommendation, mode: 'ai' });
  } catch (error) {
    console.error('audit route error', error);
    return NextResponse.json({ error: 'Unable to generate the audit right now.' }, { status: 500 });
  }
}
