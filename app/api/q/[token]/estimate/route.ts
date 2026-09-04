import { NextRequest, NextResponse } from 'next/server';
import { hashRequestSource, PUBLIC_TOKEN_PATTERN } from '@/lib/campaigns';
import { createAdminClient } from '@/lib/supabase/admin';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_REQUEST_BYTES = 10_000;

type RouteContext = {
  params: Promise<{ token: string }>;
};

function text(value: unknown, maxLength: number) {
  return String(value ?? '').trim().slice(0, maxLength);
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    if (!PUBLIC_TOKEN_PATTERN.test(token)) {
      return NextResponse.json({ error: 'This campaign link is not valid.' }, { status: 404 });
    }

    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    if (text(body.website, 200)) {
      return NextResponse.json({ saved: true }, { status: 201 });
    }

    const name = text(body.name, 120);
    const email = text(body.email, 254).toLowerCase();
    const phone = text(body.phone, 40);
    const message = text(body.message, 2_000);

    if (!name) {
      return NextResponse.json({ error: 'Enter your name.' }, { status: 400 });
    }
    if (!email && !phone) {
      return NextResponse.json({ error: 'Enter a phone number or email address.' }, { status: 400 });
    }
    if (email && !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: recipient, error: recipientError } = await supabase
      .from('campaign_recipients')
      .select('id, campaigns!inner(status)')
      .eq('public_token', token)
      .eq('campaigns.status', 'active')
      .single();

    if (recipientError || !recipient) {
      if (recipientError?.code !== 'PGRST116') {
        console.error('Unable to find estimate recipient', recipientError);
      }
      return NextResponse.json({ error: 'This campaign link is not valid.' }, { status: 404 });
    }

    const { error } = await supabase.from('estimate_requests').insert({
      recipient_id: recipient.id,
      source_hash: hashRequestSource(request.headers),
      name,
      email: email || null,
      phone: phone || null,
      message: message || null,
    });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ saved: true, duplicate: true });
      }
      if (error.code === 'P0001') {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 },
        );
      }
      console.error('Unable to save estimate request', error);
      return NextResponse.json(
        { error: 'Estimate requests are temporarily unavailable.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ saved: true }, { status: 201 });
  } catch (error) {
    console.error('Unable to capture estimate request', error);
    return NextResponse.json(
      { error: 'Estimate requests are temporarily unavailable.' },
      { status: 503 },
    );
  }
}
