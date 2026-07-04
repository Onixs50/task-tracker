"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const COMMON_TIMEZONES = [
  "Asia/Tehran",
  "Asia/Dubai",
  "Asia/Istanbul",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

export function SettingsForm({ profile }: { profile: Profile | null }) {
  const t = useTranslations("settings");
  const tDays = useTranslations("days");
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [email, setEmail] = useState<string | null>(null);
  const [timezone, setTimezone] = useState(profile?.timezone ?? "UTC");
  const [weekStart, setWeekStart] = useState(profile?.week_start ?? 6);
  const [bannerSpeed, setBannerSpeed] = useState(profile?.banner_speed ?? 3);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function save() {
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        username: username.trim().toLowerCase().replace(/\s+/g, "_") || null,
        timezone,
        theme,
        week_start: weekStart,
        banner_speed: bannerSpeed,
      })
      .eq("id", user.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  async function exportCsv() {
    setExporting(true);
    const supabase = createClient();
    const [{ data: templates }, { data: logs }] = await Promise.all([
      supabase.from("task_templates").select("id, title, category, priority"),
      supabase.from("task_logs").select("log_date, status, task_template_id"),
    ]);
    const titleById = new Map((templates ?? []).map((tpl) => [tpl.id, tpl]));
    const rows = [["date", "task", "category", "priority", "status"]];
    for (const log of logs ?? []) {
      const tpl = titleById.get(log.task_template_id);
      rows.push([log.log_date, tpl?.title ?? "", tpl?.category ?? "", tpl?.priority ?? "", log.status]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daily-ledger-history.csv";
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  async function deleteAllData() {
    if (!confirm(t("deleteConfirm"))) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("projects").delete().eq("user_id", user.id);
    await supabase.from("airdrops").delete().eq("user_id", user.id);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">{t("profile")}</h2>

        <div>
          <label className="mb-1 block text-xs text-muted">{t("displayName")}</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">{t("username")}</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
          />
        </div>

        {email && (
          <div>
            <label className="mb-1 block text-xs text-muted">{t("email")}</label>
            <p className="rounded-sm border border-border bg-bg px-2.5 py-2 text-sm text-muted">{email}</p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs text-muted">{t("timezone")}</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">{t("theme")}</label>
          <div className="flex gap-1.5">
            <button
              onClick={() => setTheme("dark")}
              className={`rounded-full border px-3 py-1 text-xs transition ${theme === "dark" ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted"}`}
            >
              {t("dark")}
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`rounded-full border px-3 py-1 text-xs transition ${theme === "light" ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted"}`}
            >
              {t("light")}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">{t("preferences")}</h2>

        <div>
          <label className="mb-1 block text-xs text-muted">{t("weekStart")}</label>
          <div className="flex flex-wrap gap-1.5">
            {[0, 1, 6].map((d) => (
              <button
                key={d}
                onClick={() => setWeekStart(d)}
                className={`rounded-full border px-3 py-1 text-xs transition ${weekStart === d ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted"}`}
              >
                {tDays(String(d))}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>{t("bannerSpeed")}</span>
            <span className="font-mono">{bannerSpeed}</span>
          </label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={bannerSpeed}
            onChange={(e) => setBannerSpeed(Number(e.target.value))}
            className="w-full accent-gold"
          />
        </div>
      </section>

      {error && <p className="text-xs text-danger">{error}</p>}
      <button onClick={save} className="w-full rounded-sm bg-gold/15 py-2 text-sm text-gold hover:bg-gold/25">
        {saved ? t("saved") : t("save")}
      </button>

      <section className="space-y-3 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">{t("data")}</h2>
        <button
          onClick={exportCsv}
          disabled={exporting}
          className="w-full rounded-sm border border-border bg-bg py-2 text-sm text-ink hover:border-gold/60 disabled:opacity-50"
        >
          {t("exportCsv")}
        </button>
      </section>

      <section className="space-y-2 rounded-lg border border-danger/30 bg-danger/5 p-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-danger">{t("dangerZone")}</h2>
        <p className="text-xs text-muted">{t("deleteAllDataHint")}</p>
        <button
          onClick={deleteAllData}
          className="w-full rounded-sm border border-danger/40 bg-danger/10 py-2 text-sm text-danger hover:bg-danger/20"
        >
          {t("deleteAllData")}
        </button>
      </section>
    </div>
  );
}
