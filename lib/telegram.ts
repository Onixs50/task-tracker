const TELEGRAM_API = "https://api.telegram.org";

export interface InlineButton {
  text: string;
  callback_data: string;
}

export type InlineKeyboard = InlineButton[][];

function apiUrl(method: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  return `${TELEGRAM_API}/bot${token}/${method}`;
}

/** Sends a message, optionally with an inline keyboard. Returns the sent message (with its id) or null. */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  keyboard?: InlineKeyboard
): Promise<{ message_id: number } | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return null;
  }
  try {
    const res = await fetch(apiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.result ?? null;
  } catch (err) {
    console.error("Telegram sendMessage failed", err);
    return null;
  }
}

/** Edits an existing message's text/keyboard in place (used for menu navigation). Falls back to null on failure. */
export async function editTelegramMessage(
  chatId: string,
  messageId: number,
  text: string,
  keyboard?: InlineKeyboard
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(apiUrl("editMessageText"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: keyboard ?? [] },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Telegram editMessageText failed", err);
    return false;
  }
}

/** Acknowledges a callback query so the button stops "spinning" on the user's end. */
export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(apiUrl("answerCallbackQuery"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, ...(text ? { text } : {}) }),
    });
  } catch (err) {
    console.error("Telegram answerCallbackQuery failed", err);
  }
}

/** Deletes a message. Silently ignores failures (e.g. message already gone, or older than 48h). */
export async function deleteTelegramMessage(chatId: string, messageId: number): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(apiUrl("deleteMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
  } catch (err) {
    console.error("Telegram deleteMessage failed", err);
  }
}

export interface BotCommand {
  command: string;
  description: string;
}

/**
 * Registers the bot's slash-command menu (the list shown next to the message
 * box). Pass a chatId to scope the list to one chat (used for the admin's
 * extra commands) — omit it to set the default list everyone else sees.
 */
export async function setTelegramCommands(commands: BotCommand[], chatId?: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(apiUrl("setMyCommands"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands,
        ...(chatId ? { scope: { type: "chat", chat_id: chatId } } : {}),
      }),
    });
  } catch (err) {
    console.error("Telegram setMyCommands failed", err);
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
