import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ReceivedTasksBoard } from "@/components/received-tasks-board";

export default async function InboxPage() {
  const supabase = createClient();
  const t = await getTranslations("inbox");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: received }, { data: projects }] = await Promise.all([
    supabase.from("received_tasks").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("created_at"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>
      <ReceivedTasksBoard initialItems={received ?? []} projects={projects ?? []} />
    </div>
  );
}
