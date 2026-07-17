import { NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/lib/telegram-bot";

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json().catch(() => null);
  if (!update) return NextResponse.json({ ok: true });

  try {
    await handleTelegramUpdate(update);
  } catch (err) {
    console.error("Telegram webhook handler failed", err);
  }

  return NextResponse.json({ ok: true });
}
