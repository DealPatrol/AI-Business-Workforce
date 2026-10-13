import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.businessType || !body?.goal) {
      return NextResponse.json({ error: 'Business type and goal are required.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json(
        { error: 'OpenAI is not configured. Set OPENAI_API_KEY on the server. No recommendation was requested.' },
        { status: 503 },
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: process.env.OPENAI_AUDIT_MODEL || 'gpt-5-mini',
      input: `You are designing an AI workforce for a small business. Return concise JSON only with keys summary (string), agents (array of 3-5 strings), firstAutomation (string), expectedOutcome (string), pilot (string). Do not promise guaranteed revenue. Business type: ${body.businessType}. Goal: ${body.goal}. Service area: ${body.serviceArea || 'not provided'}. Pain points: ${(body.painPoints || []).join(', ') || 'not provided'}. Budget: ${body.budget || 'not provided'}.`,
      text: { format: { type: 'json_object' } }
    });

    const text = response.output_text?.trim();
    if (!text) {
      return NextResponse.json({ error: 'The model returned an empty recommendation.' }, { status: 502 });
    }
    const recommendation = JSON.parse(text) as { summary?: string; agents?: string[]; firstAutomation?: string; expectedOutcome?: string; pilot?: string };
    if (!recommendation.summary || !Array.isArray(recommendation.agents)) {
      return NextResponse.json({ error: 'The model recommendation was incomplete.' }, { status: 502 });
    }
    return NextResponse.json({ recommendation, mode: 'ai' });
  } catch (error) {
    console.error('audit route error', error);
    return NextResponse.json({ error: 'Unable to generate the audit right now.' }, { status: 500 });
  }
}
