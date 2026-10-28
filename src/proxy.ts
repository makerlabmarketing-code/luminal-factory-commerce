import { NextResponse, type NextRequest } from "next/server";
import { refreshCustomerAuthSession } from "@/lib/supabase/customer-auth-proxy";
import { defaultLocale, localeHref, splitLocale } from '@/lib/i18n/locale';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const localized = splitLocale(pathname);
  const isApi = pathname.startsWith('/api/');
  const unsupportedLocale = /^\/[a-z]{2}(\/|$)/.test(pathname) && !localized.locale;
  if (!isApi && ['GET', 'HEAD'].includes(request.method) && (localized.locale === 'vi' || (!localized.locale && !unsupportedLocale))) {
    const target = request.nextUrl.clone();
    target.pathname = localeHref(pathname, defaultLocale);
    const redirect = NextResponse.redirect(target);
    redirect.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    return redirect;
  }
  const routePath = localized.path;
  const usesCustomerSession =
    routePath.startsWith("/account") ||
    routePath === "/cart" ||
    request.nextUrl.pathname === "/api/cart";
  const response = usesCustomerSession
    ? await refreshCustomerAuthSession(request)
    : NextResponse.next({ request });

  if (routePath === "/cart") {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Vary", "Cookie");
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)', "/api/account/:path*", "/api/cart"],
};
