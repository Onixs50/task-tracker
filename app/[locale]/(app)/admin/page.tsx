import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AdminBoard } from "@/components/admin-board";

export default async function AdminPage() {
  const supabase = createClient();
  const t = await getTranslations("admin");
  const locale = await getLocale();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: projects }, { data: templates }, { data: profile }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at"),
    supabase.from("task_templates").select("*").order("created_at"),
    user ? supabase.from("profiles").select("timezone").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
      <AdminBoard
        initialProjects={projects ?? []}
        initialTemplates={templates ?? []}
        locale={locale}
        timezone={profile?.timezone ?? "UTC"}
      />
    </div>
  );
}
