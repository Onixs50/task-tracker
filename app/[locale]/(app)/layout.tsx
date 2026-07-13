import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { UsernameGate } from "@/components/username-gate";
import { isSiteAdmin } from "@/lib/admin";

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let timezone = "UTC";
  let displayName: string | null = null;
  let username: string | null = null;
  let bannerSpeed = 3;
  let quotes: string[] = [];
  const email = user?.email ?? null;

  if (user) {
    const [{ data: profile }, { data: quoteRows }] = await Promise.all([
      supabase.from("profiles").select("timezone, display_name, username, banner_speed").eq("id", user.id).single(),
      supabase.from("quotes").select("text").order("created_at"),
    ]);
    timezone = profile?.timezone ?? "UTC";
    displayName = profile?.display_name ?? null;
    username = profile?.username ?? null;
    bannerSpeed = profile?.banner_speed ?? 3;
    quotes = (quoteRows ?? []).map((q) => q.text);
  }

  return (
    <AppShell
      timezone={timezone}
      displayName={username ?? displayName}
      email={email}
      quotes={quotes}
      bannerSpeed={bannerSpeed}
      isSuperAdmin={await isSiteAdmin(email)}
    >
      <UsernameGate initialUsername={username}>{children}</UsernameGate>
    </AppShell>
  );
}
