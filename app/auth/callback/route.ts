import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const locale = searchParams.get("locale") ?? "fa";
  const next = searchParams.get("next");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const destination = next && next.startsWith("/") ? next : `/${locale}`;
  return NextResponse.redirect(`${origin}${destination}`);
}
