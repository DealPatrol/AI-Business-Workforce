import { NextRequest, NextResponse } from 'next/server';
import { getBusinessBySlug, getService, openSlotsForDate } from '@/lib/bookings/store';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim() ?? '';
  const serviceId = request.nextUrl.searchParams.get('serviceId')?.trim() ?? '';
  const date = request.nextUrl.searchParams.get('date')?.trim() ?? '';
  if (!slug || !serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'slug, serviceId, and date (YYYY-MM-DD) are required.' }, { status: 400 });
  }
  try {
    const business = await getBusinessBySlug(slug);
    if (!business) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const service = await getService(serviceId);
    if (!service || service.business_id !== business.id || !service.active) {
      return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
    }
    const slots = await openSlotsForDate({ business, service, date });
    return NextResponse.json({ slots, timeZone: business.timezone });
  } catch (error) {
    console.error('Unable to list booking slots', error);
    return NextResponse.json({ error: 'Times could not be loaded right now.' }, { status: 503 });
  }
}
