"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MascotBoy } from "@/components/mascot-boy";

export type Accent = "gold" | "teal" | "danger";

export const ACCENT_CLASSES: Record<Accent, { border: string; bg: string; title: string }> = {
  gold: { border: "border-gold/30", bg: "bg-gold/5", title: "text-gold" },
  teal: { border: "border-teal/30", bg: "bg-teal/5", title: "text-teal" },
  danger: { border: "border-danger/30", bg: "bg-danger/5", title: "text-danger" },
};

export function AnnouncementBanner({
  announcement,
  initialViews,
  preview = false,
}: {
  announcement: {
    id: string;
    title: string | null;
    message: string;
    max_views: number;
    accent: Accent;
    show_mascot: boolean;
  } | null;
  initialViews: Record<string, number>;
  preview?: boolean;
}) {
  const t = useTranslations("announcements");
  const maxViews = announcement?.max_views ?? 2;
  const [visible, setVisible] = useState(
    () => !!announcement && (initialViews[announcement.id] ?? 0) < maxViews
  );

  useEffect(() => {
    if (preview || !announcement || !visible) return;
    const current = initialViews[announcement.id] ?? 0;
    const nextViews = { ...initialViews, [announcement.id]: current + 1 };
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from("profiles").update({ announcement_views: nextViews }).eq("id", data.user.id);
    });
    // only run once when the banner first appears for this announcement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcement?.id, preview]);

  if (!announcement || !visible) return null;

  function dismiss() {
    if (!announcement) return;
    setVisible(false);
    if (preview) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("profiles")
        .update({ announcement_views: { ...initialViews, [announcement.id]: maxViews } })
        .eq("id", data.user.id);
    });
  }

  const accent = ACCENT_CLASSES[announcement.accent] ?? ACCENT_CLASSES.gold;
  const content = (
    <div className="space-y-1">
      {announcement.title && <p className={`font-display text-sm font-semibold ${accent.title}`}>{announcement.title}</p>}
      <p className="whitespace-pre-wrap text-sm text-ink">{announcement.message}</p>
    </div>
  );

  return (
    <div className={`relative animate-fade-up rounded-lg border ${accent.border} ${accent.bg} p-4 pe-9`}>
      <button
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="absolute end-3 top-3 text-muted transition hover:text-ink"
      >
        <X size={15} />
      </button>
      {announcement.show_mascot ? <MascotBoy size="sm" message={content} /> : content}
    </div>
  );
}
