import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hvacMergeTarget, receptionistHomePath } from '@/lib/seo/receptionist-home';
import {
  EXECUTIVE_RECEPTIONIST_ORIGIN,
  EXECUTIVE_RECEPTIONIST_WWW_REDIRECT_STATUS,
  LEGACY_VERCEL_HOST,
  RECEPTIONIST_HOME_REDIRECT_STATUS,
  executiveReceptionistWwwRedirectUrl,
  getSiteUrl,
  hostnameOf,
  isAvaStandaloneHost,
  isExecutiveReceptionistHost,
  isFrontPorchGrowthHost,
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
  // Receptionist pages go straight to executivereceptionist.com, so there is only one hop.
  const receptionistPath = receptionistHomePath(request.nextUrl.pathname);
  if (receptionistPath) {
    return NextResponse.redirect(new URL(`${receptionistPath}${request.nextUrl.search}`, EXECUTIVE_RECEPTIONIST_ORIGIN), 308);
  }
  const destinationOrigin = getSiteUrl();
  if (hostnameOf(destinationOrigin) === LEGACY_VERCEL_HOST) return null;
  const destination = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, destinationOrigin);
  return NextResponse.redirect(destination, 308);
}

/**
 * executivereceptionist.com is the one home for receptionist content. On frontporchgrowth.com,
 * /ava, /hvac, /receptionist, /start, the industry pages and the /ava guides 301 to the matching
 * executivereceptionist.com URL, keeping the query string (UTM tags, ?trade=, ?checkout=).
 * Shared paths (/pricing, /privacy, /terms, /onboarding, /buy, /api) are not redirected.
 */
function frontPorchReceptionistRedirect(request: NextRequest) {
  if (!isFrontPorchGrowthHost(requestHost(request))) return null;
  const target = receptionistHomePath(request.nextUrl.pathname);
  if (!target) return null;
  const destination = new URL(`${target}${request.nextUrl.search}`, EXECUTIVE_RECEPTIONIST_ORIGIN);
  return NextResponse.redirect(destination, RECEPTIONIST_HOME_REDIRECT_STATUS);
}

/** Other HVAC receptionist pages were merged into /hvac. Same host, so previews redirect too. */
function hvacMergeRedirect(request: NextRequest) {
  const target = hvacMergeTarget(request.nextUrl.pathname);
  if (!target) return null;
  if (isExecutiveReceptionistHost(requestHost(request))) {
    return NextResponse.redirect(
      new URL(`${target}${request.nextUrl.search}`, EXECUTIVE_RECEPTIONIST_ORIGIN),
      RECEPTIONIST_HOME_REDIRECT_STATUS,
    );
  }
  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.redirect(url, RECEPTIONIST_HOME_REDIRECT_STATUS);
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

/**
 * executivereceptionist.com serves the landing at /receptionist for the root
 * path only. Every other path (onboarding, checkout success/cancel, login, etc.)
 * passes through so post-checkout flows are not replaced by the marketing page.
 */
function executiveReceptionistRewrite(request: NextRequest) {
  if (!isExecutiveReceptionistHost(requestHost(request))) return null;
  const { pathname } = request.nextUrl;
  if (pathname !== '/') return null;
  const url = request.nextUrl.clone();
  url.pathname = '/receptionist';
  return NextResponse.rewrite(url);
}

function wwwExecutiveReceptionistRedirect(request: NextRequest) {
  const destination = executiveReceptionistWwwRedirectUrl(requestHost(request), request.nextUrl);
  if (!destination) return null;
  return NextResponse.redirect(destination, EXECUTIVE_RECEPTIONIST_WWW_REDIRECT_STATUS);
}


/** Shared icon and default OG paths serve the owl brand on executivereceptionist.com only. */
const ER_ASSET_REWRITES: Record<string, string> = {
  '/favicon.ico': '/er/favicon.ico',
  '/icon': '/er/icon-512.png',
  '/icon.png': '/er/icon-512.png',
  '/apple-icon': '/er/apple-touch-icon.png',
  '/apple-icon.png': '/er/apple-touch-icon.png',
  '/apple-touch-icon.png': '/er/apple-touch-icon.png',
  '/icon-192.png': '/er/icon-192.png',
  '/icon-512.png': '/er/icon-512.png',
  '/og-default.png': '/er/og-default.png',
};

function executiveReceptionistAssetRewrite(request: NextRequest) {
  if (!isExecutiveReceptionistHost(requestHost(request))) return null;
  const dest = ER_ASSET_REWRITES[request.nextUrl.pathname];
  if (!dest) return null;
  const url = request.nextUrl.clone();
  url.pathname = dest;
  return NextResponse.rewrite(url);
}

export async function middleware(request: NextRequest) {
  const wwwRedirect = wwwExecutiveReceptionistRedirect(request);
  if (wwwRedirect) return wwwRedirect;

  const erAssets = executiveReceptionistAssetRewrite(request);
  if (erAssets) return erAssets;

  const redirected = legacyHostRedirect(request);
  if (redirected) return redirected;

  const receptionistHome = frontPorchReceptionistRedirect(request);
  if (receptionistHome) return receptionistHome;

  const hvacMerged = hvacMergeRedirect(request);
  if (hvacMerged) return hvacMerged;

  const executive = executiveReceptionistRewrite(request);
  if (executive) return executive;

  const standalone = standaloneAvaResponse(request);
  if (standalone) return standalone;

  const { pathname } = request.nextUrl;
  if (pathname === '/prospector/unsubscribe' && request.method === 'POST') {
    const url = request.nextUrl.clone();
    url.pathname = '/api/prospector/unsubscribe';
    return NextResponse.rewrite(url);
  }

  if (!pathname.startsWith('/dashboard') && pathname !== '/login' && pathname !== '/desk') {
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
  // The page matcher skips paths with a dot. robots, sitemap, and ER icon/OG paths still need the www → apex redirect (and ER asset rewrites).
  matcher: [
    '/((?!_next/|.*\\..*).*)',
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.ico',
    '/icon',
    '/icon.png',
    '/apple-icon',
    '/apple-icon.png',
    '/apple-touch-icon.png',
    '/icon-192.png',
    '/icon-512.png',
    '/og-default.png',
  ],
};
