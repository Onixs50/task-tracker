import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTelegramBroadcast } from "@/lib/telegram";
import { isSiteAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await isSiteAdmin(user?.email))) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { message } = await request.json().catch(() => ({ message: "" }));
  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ ok: false, error: "empty-message" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: profiles } = await service
    .from("profiles")
    .select("telegram_chat_id")
    .not("telegram_chat_id", "is", null);

  const chatIds = (profiles ?? []).map((p) => p.telegram_chat_id!).filter(Boolean);
  const sent = await sendTelegramBroadcast(chatIds, message.trim());

  await supabase.from("telegram_broadcasts").insert({
    message: message.trim(),
    sent_by: user!.id,
    recipient_count: sent,
  });

  return NextResponse.json({ ok: true, sent, total: chatIds.length });
}
