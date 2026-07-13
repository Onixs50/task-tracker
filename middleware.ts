import createIntlMiddleware from "next-intl/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { locales, defaultLocale } from "./lib/i18n/request";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

const PUBLIC_PATHS = ["/login", "/auth/callback", "/reset-password", "/about", "/shared"];

/**
 * Fire-and-forget insert into page_views, used by the Site Admin Stats
 * tab. Uses a raw REST call (not the supabase-js client) to keep this
 * light in the edge runtime. Silently no-ops if env vars aren't set yet.
 */
async function trackVisit(path: string, userId: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;
  try {
    await fetch(`${url}/rest/v1/page_views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ path, user_id: userId }),
    });
  } catch {
    // best-effort only — never let tracking break navigation
  }
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
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

  // Don't count Next.js Link hover/prefetch requests as real visits —
  // only real navigations.
  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" || request.headers.get("purpose") === "prefetch";
  if (!isPrefetch) {
    event.waitUntil(trackVisit(strippedPath || "/", user?.id ?? null));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
