import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/admin";
import { SiteAdminBoard } from "@/components/site-admin-board";

export default async function SiteAdminPage() {
  const supabase = createClient();
  const t = await getTranslations("siteAdmin");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isSuperAdmin(user?.email)) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted">
        {t("noAccess")}
      </div>
    );
  }

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted">{t("subtitle")}</p>
      <SiteAdminBoard initialAnnouncements={announcements ?? []} />
    </div>
  );
}
