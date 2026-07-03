import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isoDateInTZ, addDaysISO } from "@/lib/dates";
import { StatsView } from "@/components/stats-view";

export default async function StatsPage() {
  const supabase = createClient();
  const t = await getTranslations("stats");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const timezone = profile?.timezone ?? "UTC";
  const todayISO = isoDateInTZ(timezone);
  const yearAgo = addDaysISO(todayISO, -370);

  const [{ data: projects }, { data: templates }, { data: logs }] = await Promise.all([
    supabase.from("projects").select("*"),
    supabase.from("task_templates").select("*"),
    supabase.from("task_logs").select("*").gte("log_date", yearAgo).lte("log_date", todayISO),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
      <StatsView
        projects={projects ?? []}
        templates={templates ?? []}
        logs={logs ?? []}
        todayISO={todayISO}
      />
    </div>
  );
}
