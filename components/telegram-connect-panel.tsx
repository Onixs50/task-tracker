"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Send, CheckCircle2, Link2, Unlink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateLinkCode } from "@/lib/telegram-link";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";

export function TelegramConnectPanel({
  userId,
  initialChatId,
  initialUsername,
  initialRemindersEnabled,
}: {
  userId: string;
  initialChatId: string | null;
  initialUsername: string | null;
  initialRemindersEnabled: boolean;
}) {
  const t = useTranslations("settings");
  const [chatId, setChatId] = useState(initialChatId);
  const [tgUsername, setTgUsername] = useState(initialUsername);
  const [remindersEnabled, setRemindersEnabled] = useState(initialRemindersEnabled);
  const [code, setCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function getConnectCode() {
    setGenerating(true);
    const newCode = generateLinkCode();
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ telegram_link_code: newCode }).eq("id", userId);
    setGenerating(false);
    if (error) return;
    setCode(newCode);

    let attempts = 0;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      attempts++;
      const { data } = await supabase
        .from("profiles")
        .select("telegram_chat_id, telegram_username")
        .eq("id", userId)
        .single();
      if (data?.telegram_chat_id) {
        setChatId(data.telegram_chat_id);
        setTgUsername(data.telegram_username);
        setCode(null);
        if (pollRef.current) clearInterval(pollRef.current);
      }
      if (attempts > 40 && pollRef.current) clearInterval(pollRef.current); // ~2 minutes
    }, 3000);
  }

  async function disconnect() {
    const supabase = createClient();
    await supabase.from("profiles").update({ telegram_chat_id: null, telegram_username: null }).eq("id", userId);
    setChatId(null);
    setTgUsername(null);
  }

  async function toggleReminders(next: boolean) {
    setRemindersEnabled(next);
    const supabase = createClient();
    await supabase.from("profiles").update({ telegram_reminders_enabled: next }).eq("id", userId);
  }

  return (
    <section className="space-y-3 rounded-lg border border-border bg-surface p-5">
      <h2 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
        <Send size={13} /> {t("telegram")}
      </h2>

      {chatId ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-teal/30 bg-teal/10 px-3 py-2.5 text-sm text-teal">
            <CheckCircle2 size={15} className="shrink-0" />
            {tgUsername ? t("telegramConnectedAs", { username: tgUsername }) : t("telegramConnected")}
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={remindersEnabled}
              onChange={(e) => toggleReminders(e.target.checked)}
            />
            {t("telegramReminders")}
          </label>
          <button
            onClick={disconnect}
            className="flex items-center gap-1.5 rounded-sm border border-border px-3 py-2 text-xs text-muted hover:border-danger/50 hover:text-danger"
          >
            <Unlink size={13} /> {t("telegramDisconnect")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted">{t("telegramHint")}</p>
          {code ? (
            <div className="space-y-2 rounded-md border border-gold/30 bg-gold/5 p-3">
              <p className="text-xs text-muted">{t("telegramCodeHint")}</p>
              <p className="text-center font-mono text-lg tracking-widest text-gold">{code}</p>
              {BOT_USERNAME && (
                <a
                  href={`https://t.me/${BOT_USERNAME}?start=${code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-sm bg-gold/15 py-2 text-sm text-gold hover:bg-gold/25"
                >
                  <Link2 size={14} /> {t("telegramOpenBot")}
                </a>
              )}
              <p className="text-center text-[11px] text-muted">{t("telegramWaiting")}</p>
            </div>
          ) : (
            <button
              onClick={getConnectCode}
              disabled={generating}
              className="flex items-center gap-1.5 rounded-sm border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold hover:bg-gold/20 disabled:opacity-50"
            >
              <Send size={13} /> {t("telegramConnect")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
