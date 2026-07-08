"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { computeNextSendAt, type ReminderType } from "@/lib/reminders";

export function TaskReminderControl({
  templateId,
  timezone,
  compact = false,
}: {
  templateId: string;
  timezone: string;
  compact?: boolean;
}) {
  const t = useTranslations("reminders");
  const [loaded, setLoaded] = useState(false);
  const [type, setType] = useState<ReminderType | "off">("off");
  const [hoursFromNow, setHoursFromNow] = useState(3);
  const [timeOfDay, setTimeOfDay] = useState("20:00");
  const [intervalHours, setIntervalHours] = useState(4);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("task_reminders")
        .select("*")
        .eq("task_template_id", templateId)
        .eq("active", true)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setType(data.reminder_type);
        if (data.reminder_type === "daily_at" && data.time_of_day) setTimeOfDay(data.time_of_day);
        if (data.reminder_type === "interval" && data.interval_hours) setIntervalHours(data.interval_hours);
      }
      setLoaded(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    if (type === "off") {
      await supabase.from("task_reminders").delete().eq("task_template_id", templateId);
    } else {
      const next_send_at = computeNextSendAt(type, { hoursFromNow, timeOfDay, intervalHours }, timezone);
      await supabase.from("task_reminders").upsert(
        {
          task_template_id: templateId,
          user_id: user.id,
          reminder_type: type,
          time_of_day: type === "daily_at" ? timeOfDay : null,
          interval_hours: type === "interval" ? intervalHours : null,
          next_send_at,
          active: true,
        },
        { onConflict: "task_template_id" }
      );
    }
    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }

  if (!loaded) return null;

  return (
    <div className={compact ? "space-y-2.5" : "space-y-2.5 rounded-md border border-border bg-bg p-3"}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
        {type === "off" ? <BellOff size={13} /> : <Bell size={13} className="text-gold" />}
        {t("title")}
      </div>

      <select
        value={type}
        onChange={(e) => setType(e.target.value as ReminderType | "off")}
        className="w-full rounded-sm border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-gold/60"
      >
        <option value="off">{t("off")}</option>
        <option value="once">{t("once")}</option>
        <option value="daily_at">{t("dailyAt")}</option>
        <option value="interval">{t("everyNHours")}</option>
      </select>

      {type === "once" && (
        <div className="flex items-center gap-2 text-xs text-muted">
          {t("remindIn")}
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={hoursFromNow}
            onChange={(e) => setHoursFromNow(parseFloat(e.target.value) || 1)}
            className="w-16 rounded-sm border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-gold/60"
          />
          {t("hours")}
        </div>
      )}

      {type === "daily_at" && (
        <div className="flex items-center gap-2 text-xs text-muted">
          {t("remindAt")}
          <input
            type="time"
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            className="rounded-sm border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-gold/60"
          />
        </div>
      )}

      {type === "interval" && (
        <div className="flex items-center gap-2 text-xs text-muted">
          {t("remindEvery")}
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={intervalHours}
            onChange={(e) => setIntervalHours(parseFloat(e.target.value) || 1)}
            className="w-16 rounded-sm border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-gold/60"
          />
          {t("hours")}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-sm bg-gold/15 py-1.5 text-xs text-gold hover:bg-gold/25 disabled:opacity-50"
      >
        {savedFlash ? t("saved") : saving ? t("saving") : t("save")}
      </button>
      {type !== "off" && <p className="text-[11px] text-muted">{t("requiresTelegram")}</p>}
    </div>
  );
}
