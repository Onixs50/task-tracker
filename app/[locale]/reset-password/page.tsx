"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoginDecor } from "@/components/login-decor";
import { Mascot } from "@/components/mascot";

export default function ResetPasswordPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const supabase = createClient();
    if (code) {
      supabase.auth.exchangeCodeForSession(code).finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [searchParams]);

  async function submit() {
    if (password.length < 6) {
      setError(t("error.generic"));
      return;
    }
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(t("error.generic"));
      return;
    }
    setDone(true);
    setTimeout(() => router.push(`/${locale}`), 1500);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6">
      <LoginDecor />
      <div className="relative z-10 mb-4">
        <Mascot size="md" />
      </div>
      <div className="relative z-10 w-full max-w-sm rounded-lg border border-border bg-surface p-6 text-center animate-fade-up">
        <h1 className="font-display text-lg font-semibold">{t("resetTitle")}</h1>

        {!ready ? (
          <p className="mt-4 text-sm text-muted">…</p>
        ) : done ? (
          <p className="mt-4 text-sm text-teal">{t("resetDone")}</p>
        ) : (
          <div className="mt-4 space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={t("password")}
              className="w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm text-center outline-none focus:border-gold/60"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <button
              onClick={submit}
              className="w-full rounded-sm bg-gold/15 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/25"
            >
              {t("resetSubmit")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
