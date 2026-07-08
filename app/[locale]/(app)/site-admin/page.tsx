import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isSuperAdmin } from "@/lib/admin";
import { SiteAdminBoard } from "@/components/site-admin-board";
import { TelegramBroadcastPanel } from "@/components/telegram-broadcast-panel";

export default async function SiteAdminPage() {
  const supabase = createClient();
  const t = await getTranslations("siteAdmin");
  const locale = await getLocale();

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>
      <SiteAdminBoard initialAnnouncements={announcements ?? []} />
      <div className="border-t border-border pt-6">
        <TelegramBroadcastPanel initialBroadcasts={broadcasts ?? []} locale={locale} linkedCount={linkedCount} />
      </div>
    </div>
  );
}
