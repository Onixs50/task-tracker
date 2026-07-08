const TELEGRAM_API = "https://api.telegram.org";

/** Sends a plain-text message to a single chat. Returns true on success. */
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return false;
  }
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return res.ok;
  } catch (err) {
    console.error("Telegram sendMessage failed", err);
    return false;
  }
}

/**
 * Sends the same message to many chats, a few at a time so we stay well
 * under Telegram's ~30 messages/second limit. Returns how many succeeded.
 */
export async function sendTelegramBroadcast(chatIds: string[], text: string): Promise<number> {
  const BATCH = 20;
  let sent = 0;
  for (let i = 0; i < chatIds.length; i += BATCH) {
    const batch = chatIds.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((id) => sendTelegramMessage(id, text)));
    sent += results.filter(Boolean).length;
    if (i + BATCH < chatIds.length) await new Promise((r) => setTimeout(r, 1100));
  }
  return sent;
}
