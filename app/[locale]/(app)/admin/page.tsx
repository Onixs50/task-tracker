import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AdminBoard } from "@/components/admin-board";

export default async function AdminPage() {
  const supabase = createClient();
  const t = await getTranslations("admin");
  const locale = await getLocale();

  const [{ data: projects }, { data: templates }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at"),
    supabase.from("task_templates").select("*").order("created_at"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
      <AdminBoard initialProjects={projects ?? []} initialTemplates={templates ?? []} locale={locale} />
    </div>
  );
}
