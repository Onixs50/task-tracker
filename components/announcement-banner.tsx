"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MascotBoy } from "@/components/mascot-boy";

const MAX_VIEWS = 2;

export function AnnouncementBanner({
  announcement,
  initialViews,
}: {
  announcement: { id: string; title: string | null; message: string } | null;
  initialViews: Record<string, number>;
}) {
  const t = useTranslations("announcements");
  const [visible, setVisible] = useState(
    () => !!announcement && (initialViews[announcement.id] ?? 0) < MAX_VIEWS
  );

  useEffect(() => {
    if (!announcement || !visible) return;
    const current = initialViews[announcement.id] ?? 0;
    const nextViews = { ...initialViews, [announcement.id]: current + 1 };
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from("profiles").update({ announcement_views: nextViews }).eq("id", data.user.id);
    });
    // only run once when the banner first appears for this announcement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcement?.id]);

  if (!announcement || !visible) return null;

  function dismiss() {
    if (!announcement) return;
    setVisible(false);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("profiles")
        .update({ announcement_views: { ...initialViews, [announcement.id]: MAX_VIEWS } })
        .eq("id", data.user.id);
    });
  }

  return (
    <div className="relative animate-fade-up rounded-lg border border-gold/30 bg-gold/5 p-4">
      <button
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="absolute left-3 top-3 text-muted transition hover:text-ink rtl:left-auto rtl:right-3"
      >
        <X size={15} />
      </button>
      <MascotBoy
        size="sm"
        message={
          <div className="space-y-1">
            {announcement.title && <p className="font-display text-sm font-semibold text-gold">{announcement.title}</p>}
            <p className="whitespace-pre-wrap text-sm text-ink">{announcement.message}</p>
          </div>
        }
      />
    </div>
  );
}
