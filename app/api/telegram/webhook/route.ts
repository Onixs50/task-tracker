import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTelegramMessage } from "@/lib/telegram";

const LINKED_TEXT_FA = "متصل شدی! از این به بعد یادآوری تسک‌هات از همینجا برات میاد. برای قطع اتصال هر وقت خواستی /stop رو بفرست.";
const LINKED_TEXT_EN = "You're linked! Task reminders will now show up here. Send /stop anytime to disconnect.";

const UNKNOWN_CODE_FA = "این کد معتبر نیست یا منقضی شده. از تنظیمات سایت یه کد جدید بگیر.";
const UNKNOWN_CODE_EN = "That code isn't valid or has expired. Get a fresh one from the site's settings page.";

const NEEDS_CODE_FA = "سلام! برای اتصال حساب، از صفحه‌ی تنظیمات دفتر روزانه یه کد بگیر و با /start همراهش بفرست، یا روی همون دکمه‌ی اتصال کلیک کن.";
const NEEDS_CODE_EN = "Hi! To link your account, grab a code from Daily Ledger's settings page and send it with /start, or just tap the connect button there.";

const UNLINKED_FA = "اتصال قطع شد. هر وقت خواستی دوباره از تنظیمات سایت وصل شو.";
const UNLINKED_EN = "Disconnected. Reconnect anytime from the site's settings page.";

const NOT_LINKED_FA = "این چت به هیچ حسابی وصل نیست.";
const NOT_LINKED_EN = "This chat isn't linked to any account.";

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json().catch(() => null);
  const message = update?.message;
  const chatId: string | undefined = message?.chat?.id?.toString();
  const text: string | undefined = message?.text;
  const username: string | undefined = message?.from?.username;

  if (!chatId || !text) return NextResponse.json({ ok: true });

  const supabase = createServiceClient();

  if (text.startsWith("/start")) {
    const code = text.replace("/start", "").trim().toUpperCase();
    if (!code) {
      await sendTelegramMessage(chatId, `${NEEDS_CODE_FA}\n\n${NEEDS_CODE_EN}`);
      return NextResponse.json({ ok: true });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("telegram_link_code", code)
      .maybeSingle();

    if (!profile) {
      await sendTelegramMessage(chatId, `${UNKNOWN_CODE_FA}\n\n${UNKNOWN_CODE_EN}`);
      return NextResponse.json({ ok: true });
    }

    await supabase
      .from("profiles")
      .update({ telegram_chat_id: chatId, telegram_username: username ?? null, telegram_link_code: null })
      .eq("id", profile.id);

    await sendTelegramMessage(chatId, `${LINKED_TEXT_FA}\n\n${LINKED_TEXT_EN}`);
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/stop")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("telegram_chat_id", chatId)
      .maybeSingle();

    if (!profile) {
      await sendTelegramMessage(chatId, `${NOT_LINKED_FA}\n\n${NOT_LINKED_EN}`);
      return NextResponse.json({ ok: true });
    }

    await supabase.from("profiles").update({ telegram_chat_id: null }).eq("id", profile.id);
    await sendTelegramMessage(chatId, `${UNLINKED_FA}\n\n${UNLINKED_EN}`);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
