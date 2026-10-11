import { NextResponse } from 'next/server';
import { PlacesError, ProspectorSetupError, PublicFetchError, ValidationError } from '@/lib/prospector/errors';
import { createClient } from '@/lib/supabase/server';

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof ValidationError) return jsonError(error.message, 400);
  if (error instanceof ProspectorSetupError) return jsonError(error.message, 503);
  if (error instanceof PublicFetchError) return jsonError(error.message, 400);
  if (error instanceof PlacesError) return jsonError(error.message, error.status >= 500 ? 502 : 400);
  console.error('prospector error', error);
  const message = error instanceof Error ? error.message : 'Something went wrong. Try again.';
  return jsonError(message.slice(0, 300), 500);
}

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { supabase, user: null, response: jsonError('Sign in required.', 401) };
  }
  return { supabase, user: data.user, response: null };
}
