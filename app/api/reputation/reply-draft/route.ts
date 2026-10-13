import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { currentUserEmail } from '@/lib/ava/client-access';
import { ownedBusiness } from '@/lib/reputation/store';

export const dynamic = 'force-dynamic';

/** Drafts a reply the owner edits and pastes on Google themselves. Nothing is posted. */
export async function POST(req: NextRequest) {
  const email = await currentUserEmail();
  if (!email) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const business = await ownedBusiness(email, String(body.businessId || ''));
  if (!business) return NextResponse.json({ error: 'Not your business.' }, { status: 403 });
  const review = String(body.review || '').trim().slice(0, 3000);
  const stars = Math.max(1, Math.min(5, Number(body.stars) || 5));
  if (!review && !body.stars) return NextResponse.json({ error: 'Paste the review text.' }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Reply drafts are not configured.' }, { status: 503 });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_REPLY_MODEL || 'gpt-4o-mini',
    max_tokens: 220,
    temperature: 0.6,
    messages: [
      {
        role: 'system',
        content: `You write short public replies to customer reviews for ${business.name}, a local business. Tone: ${business.reply_tone || 'friendly'}. 2-4 sentences. Thank the reviewer by first name if given. For negative reviews: apologize without admitting legal fault, do not argue, invite them to call or email to make it right. Never offer discounts or incentives for reviews. Do not invent facts about the job. Plain text only.`,
      },
      { role: 'user', content: `${stars}-star review${body.reviewer ? ` from ${String(body.reviewer).slice(0, 60)}` : ''}:\n${review || '(no text, rating only)'}` },
    ],
  });
  return NextResponse.json({ draft: completion.choices[0]?.message?.content?.trim() || '' });
}
