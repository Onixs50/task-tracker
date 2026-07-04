"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

const FLAG_PREFIX = "daily-ledger:reminder-shown:";

export function TaskReminder({ remaining, timezone }: { remaining: number; timezone: string }) {
  const t = useTranslations("dashboard");

  useEffect(() => {
    if (remaining <= 0) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const hour = Number(
      new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", hour12: false }).format(new Date())
    );
    if (hour < 20) return;

    const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
    const flag = `${FLAG_PREFIX}${todayKey}`;
    if (localStorage.getItem(flag)) return;

    async function notify() {
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      if (permission === "granted") {
        new Notification("Daily Ledger", { body: `${remaining} ${t("remaining")}` });
        localStorage.setItem(flag, "1");
      }
    }
    notify();
  }, [remaining, timezone, t]);

  return null;
}
