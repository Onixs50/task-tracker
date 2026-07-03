import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { UsernameGate } from "@/components/username-gate";

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let timezone = "UTC";
  let displayName: string | null = null;
  let username: string | null = null;
  let showQuotes = true;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone, display_name, username, show_quotes")
      .eq("id", user.id)
      .single();
    timezone = profile?.timezone ?? "UTC";
    displayName = profile?.display_name ?? null;
    username = profile?.username ?? null;
    showQuotes = profile?.show_quotes ?? true;
  }

  return (
    <AppShell timezone={timezone} displayName={username ?? displayName} showQuotes={showQuotes}>
      <UsernameGate initialUsername={username}>{children}</UsernameGate>
    </AppShell>
  );
}
