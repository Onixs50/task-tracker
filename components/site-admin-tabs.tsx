"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Megaphone, BarChart3, Users } from "lucide-react";

const TABS = [
  { key: "announcements", icon: Megaphone },
  { key: "stats", icon: BarChart3 },
  { key: "admins", icon: Users },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function SiteAdminTabs({
  announcementsContent,
  statsContent,
  adminsContent,
}: {
  announcementsContent: ReactNode;
  statsContent: ReactNode;
  adminsContent: ReactNode;
}) {
  const t = useTranslations("siteAdmin");
  const [active, setActive] = useState<TabKey>("announcements");

  const content: Record<TabKey, ReactNode> = {
    announcements: announcementsContent,
    stats: statsContent,
    admins: adminsContent,
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-1.5 overflow-x-auto">
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition ${
              active === key ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted hover:text-ink"
            }`}
          >
            <Icon size={13} />
            {t(`tab_${key}`)}
          </button>
        ))}
      </div>
      <div>{content[active]}</div>
    </div>
  );
}
