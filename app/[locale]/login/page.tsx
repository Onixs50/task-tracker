"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mascot } from "@/components/mascot";
import { LoginDecor } from "@/components/login-decor";
import { GemStatic } from "@/components/gem";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

type Mode = "signIn" | "signUp" | "forgot" | "verify";

export default function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations("auth");
  const tApp = useTranslations("app");
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?locale=${locale}` },
    });
  }

  async function verifyCode() {
    setError(null);
    if (code.trim().length < 6) {
      setError(t("error.invalidCode"));
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "signup",
    });
    setLoading(false);
    if (verifyError) {
      setError(t("error.invalidCode"));
      return;
    }
    router.push(`/${locale}`);
    router.refresh();
  }

  async function resendCode() {
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email });
    setInfo(t("resendSent"));
  }

  async function submit() {
    setError(null);
    setInfo(null);

    if (mode === "forgot") {
      if (!email) {
        setError(t("error.generic"));
        return;
      }
      setLoading(true);
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/reset-password`,
      });
      setLoading(false);
      setInfo(t("resetSent"));
      return;
    }

    if (!email || !password || (mode === "signUp" && username.trim().length < 3)) {
      setError(t("error.generic"));
      return;
    }
    setLoading(true);
    const supabase = createClient();

    if (mode === "signUp") {
      const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "_");
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: cleanUsername } },
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message.includes("duplicate") ? t("error.usernameTaken") : t("error.generic"));
        return;
      }
      if (!data.session) {
        // email confirmation is required — collect the OTP code instead of a magic link
        setMode("verify");
        return;
      }
      router.push(`/${locale}`);
      router.refresh();
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (signInError) {
        setError(t("error.generic"));
        return;
      }
      router.push(`/${locale}`);
      router.refresh();
    }
  }

  return (
    <>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6 pb-16 animate-page-fade-in">
        <LoginDecor />

        <div className="absolute top-4 flex w-full max-w-sm items-center justify-between px-1">
          <span className="font-display text-sm font-medium text-muted">{tApp("name")}</span>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="relative z-10 mb-2">
          <GemStatic size={72} />
        </div>

        <div className="relative z-10 mb-4">
          <Mascot size="md" message={mode === "signUp" ? t("mascotSignup") : t("tagline")} />
        </div>

        <div className="relative z-10 w-full max-w-sm rounded-lg border border-border bg-surface p-6 animate-fade-up">
          {mode === "verify" ? (
            <div className="space-y-3 text-center">
              <h2 className="font-display text-base font-semibold">{t("verifyTitle")}</h2>
              <p className="text-xs text-muted">{t("verifySubtitle", { email })}</p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                placeholder={t("codePlaceholder")}
                className="w-full rounded-sm border border-border bg-bg px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-gold/60"
                maxLength={6}
              />
              {error && <p className="text-xs text-danger">{error}</p>}
              {info && <p className="text-xs text-teal">{info}</p>}
              <button
                onClick={verifyCode}
                disabled={loading}
                className="w-full animate-pulse-glow rounded-sm bg-gold/15 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/25 disabled:opacity-50"
              >
                {t("verifyButton")}
              </button>
              <button onClick={resendCode} className="text-xs text-muted hover:text-gold">
                {t("resendCode")}
              </button>
            </div>
          ) : (
            <>
              {mode !== "forgot" && (
                <div className="mb-5 flex rounded-md border border-border bg-bg p-0.5 text-sm">
                  <button
                    onClick={() => setMode("signIn")}
                    className={`flex-1 rounded-sm py-1.5 transition ${mode === "signIn" ? "bg-gold/15 text-gold" : "text-muted"}`}
                  >
                    {t("signIn")}
                  </button>
                  <button
                    onClick={() => setMode("signUp")}
                    className={`flex-1 rounded-sm py-1.5 transition ${mode === "signUp" ? "bg-gold/15 text-gold" : "text-muted"}`}
                  >
                    {t("signUp")}
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {mode === "signUp" && (
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t("username")}
                    className="w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-gold/60"
                  />
                )}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("email")}
                  className="w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-gold/60"
                />
                {mode !== "forgot" && (
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder={t("password")}
                    className="w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-gold/60"
                  />
                )}

                {mode === "signIn" && (
                  <button
                    onClick={() => { setMode("forgot"); setError(null); setInfo(null); }}
                    className="text-xs text-muted hover:text-gold"
                  >
                    {t("forgotPassword")}
                  </button>
                )}

                {error && <p className="text-xs text-danger">{error}</p>}
                {info && <p className="text-xs text-teal">{info}</p>}

                <button
                  onClick={submit}
                  disabled={loading}
                  className="w-full animate-pulse-glow rounded-sm bg-gold/15 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/25 disabled:opacity-50"
                >
                  {mode === "signUp" ? t("submitSignUp") : mode === "forgot" ? t("sendResetLink") : t("submitSignIn")}
                </button>

                {mode === "forgot" && (
                  <button onClick={() => setMode("signIn")} className="w-full text-xs text-muted hover:text-gold">
                    {t("switchToSignIn")}
                  </button>
                )}
              </div>

              {mode !== "forgot" && (
                <>
                  <div className="my-4 flex items-center gap-3 text-xs text-muted">
                    <span className="h-px flex-1 bg-border" />
                    {t("or")}
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <button
                    onClick={signInWithGoogle}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-bg px-4 py-2.5 text-sm font-medium text-ink transition hover:border-gold/60 hover:text-gold"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A10.99 10.99 0 0 0 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.85z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z" />
                    </svg>
                    {t("google")}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        <Link href={`/${locale}/about`} className="relative z-10 mt-6 text-xs text-muted underline-offset-2 hover:text-gold hover:underline">
          {t("aboutLink")}
        </Link>
      </div>
    </>
  );
}
