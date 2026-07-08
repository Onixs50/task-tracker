import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTelegramMessage } from "@/lib/telegram";
import { isoDateInTZ, hourInTZ } from "@/lib/dates";
import { isDueOn } from "@/lib/recurrence";

// Runs hourly (see vercel.json). Only actually messages a user once their
// local time hits REMINDER_HOUR, so everyone gets it at roughly the same
// point in their own evening regardless of timezone.
const REMINDER_HOUR = 20;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, timezone, locale, telegram_chat_id, telegram_reminders_enabled")
    .not("telegram_chat_id", "is", null)
    .eq("telegram_reminders_enabled", true);

  const due = (profiles ?? []).filter((p) => hourInTZ(p.timezone || "UTC") === REMINDER_HOUR);

  let sent = 0;
  for (const profile of due) {
    const todayISO = isoDateInTZ(profile.timezone || "UTC");

    const { data: templates } = await supabase
      .from("task_templates")
      .select("*")
      .eq("user_id", profile.id)
      .eq("active", true)
      .eq("archived", false);

    const dueToday = (templates ?? []).filter((tpl) => isDueOn(tpl, todayISO));
    if (dueToday.length === 0) continue;

    const { data: logs } = await supabase
      .from("task_logs")
      .select("task_template_id, status")
      .eq("user_id", profile.id)
      .eq("log_date", todayISO);

    const doneIds = new Set((logs ?? []).filter((l) => l.status === "done").map((l) => l.task_template_id));
    const pending = dueToday.filter((tpl) => !doneIds.has(tpl.id));
    if (pending.length === 0) continue;

    const isFa = profile.locale === "fa";
    const list = pending.map((tpl) => `${tpl.emoji} ${tpl.title}`).join("\n");
    const text = isFa
      ? `📋 یادآوری دفتر روزانه\n\nهنوز این‌ کارها امروز انجام نشدن:\n${list}`
      : `📋 Daily Ledger reminder\n\nStill pending today:\n${list}`;

    const ok = await sendTelegramMessage(profile.telegram_chat_id!, text);
    if (ok) sent++;
  }

  return NextResponse.json({ ok: true, checked: due.length, sent });
}
