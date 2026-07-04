import createIntlMiddleware from "next-intl/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale } from "./lib/i18n/request";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

const PUBLIC_PATHS = ["/login", "/auth/callback", "/reset-password"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // The Supabase OAuth callback lives outside the [locale] routing tree —
  // never let next-intl redirect or rewrite it.
  if (pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  const response = intlMiddleware(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const strippedPath = "/" + pathname.split("/").slice(2).join("/");
  const isPublic = PUBLIC_PATHS.some((p) => strippedPath === p || strippedPath.startsWith(p));

  if (!user && !isPublic) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && strippedPath === "/login") {
    const locale = pathname.split("/")[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
