import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTelegramMessage } from "@/lib/telegram";
import { isoDateInTZ, nextDailyOccurrenceUTC } from "@/lib/dates";

/**
 * This is purely a delivery mechanism — it never decides on its own to
 * remind anyone about anything. It only fires the exact reminders a user
 * explicitly scheduled on a specific task (see task_reminders), and it
 * skips a reminder entirely if that task's already marked done today.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();

  const { data: dueReminders } = await supabase
    .from("task_reminders")
    .select("*")
    .eq("active", true)
    .lte("next_send_at", now.toISOString());

  if (!dueReminders || dueReminders.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, sent: 0 });
  }

  const templateIds = [...new Set(dueReminders.map((r) => r.task_template_id))];
  const userIds = [...new Set(dueReminders.map((r) => r.user_id))];

  const [{ data: templates }, { data: profiles }] = await Promise.all([
    supabase.from("task_templates").select("id, title, emoji, active, archived").in("id", templateIds),
    supabase
      .from("profiles")
      .select("id, timezone, locale, telegram_chat_id, telegram_reminders_enabled")
      .in("id", userIds),
  ]);

  const templateMap = new Map((templates ?? []).map((tpl) => [tpl.id, tpl]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  let sent = 0;

  for (const reminder of dueReminders) {
    const tpl = templateMap.get(reminder.task_template_id);
    const profile = profileMap.get(reminder.user_id);
    const timezone = profile?.timezone || "UTC";

    // Always decide the row's next state first, so a broken reminder can
    // never get stuck re-triggering the dispatcher on every run.
    let patch: { active?: boolean; next_send_at?: string };
    if (reminder.reminder_type === "once") {
      patch = { active: false };
    } else if (reminder.reminder_type === "daily_at") {
      patch = { next_send_at: nextDailyOccurrenceUTC(timezone, reminder.time_of_day || "20:00", new Date(now.getTime() + 60_000)).toISOString() };
    } else {
      const hours = reminder.interval_hours || 3;
      patch = { next_send_at: new Date(now.getTime() + hours * 3_600_000).toISOString() };
    }

    let shouldSend = !!tpl && tpl.active && !tpl.archived && !!profile?.telegram_chat_id && profile.telegram_reminders_enabled;

    if (shouldSend) {
      const todayISO = isoDateInTZ(timezone);
      const { data: log } = await supabase
        .from("task_logs")
        .select("status")
        .eq("task_template_id", reminder.task_template_id)
        .eq("log_date", todayISO)
        .maybeSingle();
      if (log?.status === "done") shouldSend = false;
    }

    if (shouldSend) {
      const isFa = profile!.locale === "fa";
      const text = isFa
        ? `🔔 یادآوری: ${tpl!.emoji} ${tpl!.title}`
        : `🔔 Reminder: ${tpl!.emoji} ${tpl!.title}`;
      const ok = await sendTelegramMessage(profile!.telegram_chat_id!, text);
      if (ok) sent++;
    }

    await supabase.from("task_reminders").update(patch).eq("id", reminder.id);
  }

  return NextResponse.json({ ok: true, checked: dueReminders.length, sent });
}
