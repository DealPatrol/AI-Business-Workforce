import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  LEGACY_VERCEL_HOST,
  getSiteUrl,
  hostnameOf,
  isAvaStandaloneHost,
  isLegacyHostPagePath,
} from '@/lib/site-url';

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

function requestHost(request: NextRequest) {
  return request.headers.get('x-forwarded-host') || request.headers.get('host');
}

/**
 * 308 page routes off the old Vercel host. /api stays put so the Stripe and
 * ElevenLabs webhooks configured on that host keep working. /_next and files
 * with an extension stay put too.
 */
function legacyHostRedirect(request: NextRequest) {
  if (hostnameOf(requestHost(request)) !== LEGACY_VERCEL_HOST) return null;
  if (!isLegacyHostPagePath(request.nextUrl.pathname)) return null;
  const destinationOrigin = getSiteUrl();
  if (hostnameOf(destinationOrigin) === LEGACY_VERCEL_HOST) return null;
  const destination = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, destinationOrigin);
  return NextResponse.redirect(destination, 308);
}

/** Only when AVA_STANDALONE_HOST is set to some other host. Unset in production. */
function standaloneAvaResponse(request: NextRequest) {
  if (!isAvaStandaloneHost(requestHost(request))) return null;
  const { pathname } = request.nextUrl;
  if (pathname === '/ava' || pathname === '/ava/') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url, 308);
  }
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/ava';
    return NextResponse.rewrite(url);
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const redirected = legacyHostRedirect(request);
  if (redirected) return redirected;

  const standalone = standaloneAvaResponse(request);
  if (standalone) return standalone;

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/dashboard') && pathname !== '/login') {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!api/|_next/|.*\\..*).*)'],
};
