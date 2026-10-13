import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

function clip(value: unknown, max: number) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send an email address to join the list.' }, { status: 400 });
  }

  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  if (clip(record.companyWebsite, 200)) {
    return NextResponse.json({ ok: true });
  }

  const email = clip(record.email, 320).toLowerCase();
  const name = clip(record.name, 120);
  const businessName = clip(record.businessName, 160);
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('invoicing_waitlist').insert({
      email,
      name,
      business_name: businessName,
    });
    if (error?.code === '23505') {
      return NextResponse.json({ ok: true, alreadyOnList: true });
    }
    if (error) {
      console.error('invoicing waitlist insert failed', error);
      return NextResponse.json({ error: 'The list could not be saved. Try again in a moment.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, alreadyOnList: false });
  } catch (error) {
    console.error('invoicing waitlist unavailable', error);
    return NextResponse.json(
      { error: 'The waitlist is not connected yet. Email colecollins763@gmail.com and we will add you.' },
      { status: 503 },
    );
  }
}
