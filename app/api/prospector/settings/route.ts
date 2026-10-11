import { NextResponse } from 'next/server';
import { errorResponse, readJson, requireUser } from '@/lib/prospector/http';
import { parseSettingsInput } from '@/lib/prospector/input';
import { getSettings, saveSettings } from '@/lib/prospector/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const settings = await getSettings(auth.supabase, auth.user.id);
    return NextResponse.json({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const settings = parseSettingsInput(await readJson(request));
    const saved = await saveSettings(auth.supabase, auth.user.id, settings);
    return NextResponse.json({ settings: saved });
  } catch (error) {
    return errorResponse(error);
  }
}
