import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  getAvaOnboarding,
  provisionStoredAvaOnboarding,
} from '@/lib/ava/onboarding-store';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function authorized(request: NextRequest, secret: string) {
  const authorization = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  const providedBuffer = Buffer.from(authorization);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function POST(request: NextRequest) {
  const secret = process.env.AVA_PROVISIONING_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Internal Ava provisioning is not configured.' },
      { status: 503 },
    );
  }
  if (!authorized(request, secret)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const onboardingId = String(body.onboardingId ?? '').trim();
    if (!UUID_PATTERN.test(onboardingId)) {
      return NextResponse.json({ error: 'A valid onboardingId is required.' }, { status: 400 });
    }

    const onboarding = await getAvaOnboarding(onboardingId);
    const provisioning = await provisionStoredAvaOnboarding(onboarding);

    return NextResponse.json({ onboardingId, provisioning });
  } catch (error) {
    console.error('Ava internal provisioning error', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Could not provision the Ava agent.',
      },
      { status: 502 },
    );
  }
}
