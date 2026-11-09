import { headers } from 'next/headers';

/** Public host for this request. Vercel sends the original host in x-forwarded-host. */
export async function requestHost() {
  const headerList = await headers();
  return headerList.get('x-forwarded-host') || headerList.get('host');
}
