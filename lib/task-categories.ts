import type { TaskCategory } from "./supabase/types";

export const TASK_CATEGORIES: { key: TaskCategory; emoji: string }[] = [
  { key: "transaction", emoji: "🔄" },
  { key: "liquidity_check", emoji: "💧" },
  { key: "daily_checkin", emoji: "📅" },
  { key: "discord", emoji: "💬" },
  { key: "tweet", emoji: "🐦" },
  { key: "content", emoji: "🎬" },
  { key: "telegram_push", emoji: "📨" },
  { key: "custom", emoji: "✅" },
];

export const EMOJI_PICKS = [
  "✅", "🔄", "💧", "📅", "💬", "🐦", "🎬", "🪂", "💰", "🔥",
  "⚡", "🚀", "🧠", "🛠️", "📈", "🔒", "🎯", "⏰", "📝", "🌟",
];
