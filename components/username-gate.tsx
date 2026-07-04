"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mascot } from "./mascot";

export function UsernameGate({
  children,
  initialUsername,
}: {
  children: ReactNode;
  initialUsername: string | null;
}) {
  const t = useTranslations("onboarding");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = value.trim().toLowerCase().replace(/\s+/g, "_");
    if (trimmed.length < 3) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: trimmed, display_name: trimmed })
      .eq("id", user.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message.includes("duplicate") ? tAuth("error.usernameTaken") : tAuth("error.generic"));
      return;
    }
    setUsername(trimmed);
    router.refresh();
  }

  if (username) return <>{children}</>;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 text-center animate-fade-up">
        <div className="mb-4 flex justify-center">
          <Mascot size="md" />
        </div>
        <h2 className="font-display text-lg font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("prompt")}</p>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder={t("placeholder")}
          className="mt-4 w-full rounded-sm border border-border bg-bg px-3 py-2 text-center text-sm outline-none focus:border-gold/60"
        />
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}

        <button
          onClick={save}
          disabled={saving || value.trim().length < 3}
          className="mt-4 w-full rounded-sm bg-gold/15 py-2 text-sm text-gold transition hover:bg-gold/25 disabled:opacity-50"
        >
          {t("save")}
        </button>
      </div>
    </div>
  );
}
