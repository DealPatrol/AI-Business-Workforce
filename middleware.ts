import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAvaMarketingHost } from '@/lib/site';

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

function requestHost(request: NextRequest) {
  return request.headers.get('x-forwarded-host') || request.headers.get('host');
}

function marketingRewrite(request: NextRequest) {
  if (!isAvaMarketingHost(requestHost(request))) return null;
  const { pathname } = request.nextUrl;

  if (pathname === '/ava' || pathname === '/ava/') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    if (url.searchParams.has('checkout')) url.hash = 'pricing';
    return NextResponse.redirect(url, 308);
  }

  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/ava';
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-ava-marketing-host', '1');
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const rewritten = marketingRewrite(request);
  if (rewritten) return rewritten;

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
  matcher: ['/', '/ava', '/dashboard/:path*', '/login'],
};
