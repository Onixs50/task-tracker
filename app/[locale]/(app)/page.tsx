import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isoDateInTZ, addDaysISO } from "@/lib/dates";
import { isDueOn } from "@/lib/recurrence";
import { computeStreak } from "@/lib/stats";
import { TaskChecklist } from "@/components/task-checklist";
import { Mascot } from "@/components/mascot";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { TaskReminder } from "@/components/task-reminder";

export default async function DashboardPage() {
  const supabase = createClient();
  const t = await getTranslations("dashboard");
  const locale = await getLocale();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, username, display_name, created_at, announcement_views")
    .eq("id", user.id)
    .single();
  const timezone = profile?.timezone ?? "UTC";
  const name = profile?.username ?? profile?.display_name ?? "";
  const todayISO = isoDateInTZ(timezone);

  const { data: announcement } = await supabase
    .from("announcements")
    .select("id, title, message, max_views, accent, show_mascot")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isNew =
    profile?.created_at && new Date(profile.created_at).getTime() > Date.now() - 1000 * 60 * 60 * 24;

  const [{ data: projects }, { data: templates }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at"),
    supabase.from("task_templates").select("*").eq("active", true).eq("archived", false),
  ]);

  const dueToday = (templates ?? []).filter((tpl) => isDueOn(tpl, todayISO));

  const { data: todayLogs } = await supabase
    .from("task_logs")
    .select("*")
    .eq("log_date", todayISO);

  const doneCount = (todayLogs ?? []).filter((l) => l.status === "done").length;
  const remaining = Math.max(dueToday.length - doneCount, 0);

  const { data: streakLogs } = await supabase
    .from("task_logs")
    .select("*")
    .gte("log_date", addDaysISO(todayISO, -90))
    .lte("log_date", todayISO);

  const streak = computeStreak(templates ?? [], streakLogs ?? [], todayISO);

  return (
    <div className="space-y-6">
      <TaskReminder remaining={remaining} timezone={timezone} />
      <AnnouncementBanner announcement={announcement ?? null} initialViews={profile?.announcement_views ?? {}} />
      {name && (
        <Mascot
          size="sm"
          message={t(isNew ? "welcomeFirst" : "welcome", { name })}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{name ? t("titleWithName", { name }) : t("title")}</h1>
        <div className="flex items-center gap-2">
          {dueToday.length > 0 && (
            <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-xs text-gold">
              {remaining} {t("remaining")}
            </span>
          )}
          {streak > 0 && (
            <span className="rounded-full border border-teal/30 bg-teal/10 px-3 py-1 font-mono text-xs text-teal">
              {streak} {t("streak")}
            </span>
          )}
        </div>
      </div>

      <TaskChecklist
        projects={projects ?? []}
        templates={dueToday}
        logs={todayLogs ?? []}
        todayISO={todayISO}
        locale={locale}
        timezone={timezone}
      />
    </div>
  );
}
