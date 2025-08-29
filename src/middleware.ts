import { NextRequest, NextResponse } from 'next/server';
import { LOCALES, DEFAULT_LOCALE } from '@/lib/constants';
import { ROUTE_PROTECTION } from '@/types/roles';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/fonts/') ||
    pathname.includes('.') ||
    pathname.startsWith('/.well-known/')
  ) {
    return NextResponse.next();
  }

  // Update Supabase session for all other requests
  let response = await updateSession(request);

  // Check if the pathname starts with a supported locale
  const pathnameHasLocale = LOCALES.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Determine if this is an admin route (with or without locale prefix)
  const pathSegments = pathname.split('/').filter(Boolean);
  const maybeLocale = pathSegments[0];
  const hasLeadingLocale = LOCALES.includes(maybeLocale as any);
  const routePathWithoutLocale = hasLeadingLocale
    ? `/${pathSegments.slice(1).join('/')}`
    : pathname;
  const isAdminPath =
    routePathWithoutLocale === '/admin' ||
    routePathWithoutLocale.startsWith('/admin/');

  // Helper: get preferred locale from cookie or Accept-Language
  const getPreferredLocale = (_isAdmin: boolean): string => {
    // 1) Cookie wins if valid
    const cookieLocale = request.cookies.get('locale')?.value;
    if (cookieLocale && LOCALES.includes(cookieLocale as any)) {
      return cookieLocale;
    }

    // 2) Accept-Language header parsing (simple weight-insensitive)
    const accept = request.headers.get('accept-language') || '';
    const langs = accept
      .split(',')
      .map(l => l.trim().split(';')[0])
      .filter(Boolean);

    for (const lang of langs) {
      const base = lang.toLowerCase().split('-')[0];
      if (LOCALES.includes(base as any)) return base;
    }

    // 3) Fallback: usar DEFAULT_LOCALE configurado
    return DEFAULT_LOCALE as string;
  };

  // If no locale in pathname, redirect to preferred/default locale
  if (!pathnameHasLocale) {
    const defaultLocale = getPreferredLocale(isAdminPath);

    // Handle root path
    if (pathname === '/') {
      response = NextResponse.redirect(
        new URL(`/${defaultLocale}`, request.url)
      );
      response.cookies.set('locale', defaultLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
      return response;
    }

    // Handle other paths - redirect to proper default version
    response = NextResponse.redirect(
      new URL(`/${defaultLocale}${pathname}${search}`, request.url)
    );
    response.cookies.set('locale', defaultLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  // Extract locale from pathname
  const locale = pathname.split('/')[1] as any;

  // Validate locale
  if (!LOCALES.includes(locale)) {
    const targetLocale = getPreferredLocale(isAdminPath);
    response = NextResponse.redirect(
      new URL(`/${targetLocale}${pathname}${search}`, request.url)
    );
    response.cookies.set('locale', targetLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  // Enforce Spanish locale for admin routes
  if (isAdminPath && locale !== 'es') {
    const adminPath = routePathWithoutLocale;
    response = NextResponse.redirect(
      new URL(`/es${adminPath}${search}`, request.url)
    );
    response.cookies.set('locale', 'es', { path: '/', maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  // Check for admin-only route protection
  const routePath = pathname.replace(`/${locale}`, '') || '/';
  const protection = getRouteProtection(routePath);

  if (protection === 'admin') {
    // For admin routes, we'll let the client-side components handle the protection
    // This is because we need user session data which is only available client-side
    // The AdminOnlyRoute component will handle the actual protection
    return response;
  }

  // Continue with the request
  return response;
}

// Helper function to get route protection
function getRouteProtection(pathname: string): 'public' | 'admin' {
  // Check exact matches first
  if (ROUTE_PROTECTION[pathname as keyof typeof ROUTE_PROTECTION]) {
    return ROUTE_PROTECTION[pathname as keyof typeof ROUTE_PROTECTION] as
      | 'public'
      | 'admin';
  }

  // Check pattern matches (for dynamic routes)
  for (const [pattern, protection] of Object.entries(ROUTE_PROTECTION)) {
    if (pattern.includes('[') && pattern.includes(']')) {
      // Convert pattern to regex
      const regexPattern = pattern
        .replace(/\[.*?\]/g, '[^/]+') // Replace [id] with [^/]+
        .replace(/\//g, '\\/'); // Escape slashes

      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(pathname)) {
        return protection as 'public' | 'admin';
      }
    }
  }

  // Default to public
  return 'public';
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc.) and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
  // Force Node.js runtime instead of Edge Runtime for Netlify compatibility
  runtime: 'nodejs',
};
