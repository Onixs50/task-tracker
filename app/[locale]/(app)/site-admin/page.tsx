import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isSiteAdmin, isSuperAdmin, listSiteAdmins } from "@/lib/admin";
import { getSiteStats } from "@/lib/site-stats";
import { SiteAdminBoard } from "@/components/site-admin-board";
import { TelegramBroadcastPanel } from "@/components/telegram-broadcast-panel";
import { SiteStatsView } from "@/components/site-stats-view";
import { SiteAdminManager } from "@/components/site-admin-manager";
import { SiteAdminTabs } from "@/components/site-admin-tabs";

export default async function SiteAdminPage() {
  const supabase = createClient();
  const t = await getTranslations("siteAdmin");
  const locale = await getLocale();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await isSiteAdmin(user?.email))) {
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

  const { data: broadcasts } = await supabase
    .from("telegram_broadcasts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  // Counting how many users have linked Telegram requires reading across
  // all profiles, which RLS blocks for a normal session — service role only.
  let linkedCount = 0;
  try {
    const service = createServiceClient();
    const { count } = await service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("telegram_chat_id", "is", null);
    linkedCount = count ?? 0;
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY not configured yet — broadcast panel still
    // works, it just can't show a linked-members count.
  }

  const [siteStats, admins] = await Promise.all([getSiteStats(), listSiteAdmins()]);
  const canManageAdmins = isSuperAdmin(user?.email);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>

      <SiteAdminTabs
        announcementsContent={
          <div className="space-y-6">
            <SiteAdminBoard initialAnnouncements={announcements ?? []} />
            <div className="border-t border-border pt-6">
              <TelegramBroadcastPanel initialBroadcasts={broadcasts ?? []} locale={locale} linkedCount={linkedCount} />
            </div>
          </div>
        }
        statsContent={<SiteStatsView stats={siteStats} />}
        adminsContent={<SiteAdminManager initialAdmins={admins} canManage={canManageAdmins} />}
      />
    </div>
  );
}
