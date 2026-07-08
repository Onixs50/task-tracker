"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, History } from "lucide-react";
import { formatDisplayDate } from "@/lib/dates";
import type { Database } from "@/lib/supabase/types";

type Broadcast = Database["public"]["Tables"]["telegram_broadcasts"]["Row"];

export function TelegramBroadcastPanel({
  initialBroadcasts,
  locale,
  linkedCount,
}: {
  initialBroadcasts: Broadcast[];
  locale: string;
  linkedCount: number;
}) {
  const t = useTranslations("siteAdmin");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [broadcasts, setBroadcasts] = useState(initialBroadcasts);

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/telegram/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(t("broadcastSent", { sent: data.sent, total: data.total }));
        setBroadcasts((prev) => [
          { id: crypto.randomUUID(), message: message.trim(), sent_by: null, recipient_count: data.sent, created_at: new Date().toISOString() },
          ...prev,
        ]);
        setMessage("");
      } else {
        setResult(t("broadcastError"));
      }
    } catch {
      setResult(t("broadcastError"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">{t("telegramBroadcast")}</h2>
        <span className="text-xs text-muted">{t("linkedMembers", { count: linkedCount })}</span>
      </div>

      <div className="space-y-3 rounded-md border border-border bg-surface p-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("broadcastPlaceholder")}
          rows={3}
          className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
        />
        <button
          onClick={send}
          disabled={sending || !message.trim()}
          className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-gold/15 py-2 text-sm text-gold hover:bg-gold/25 disabled:opacity-50"
        >
          <Send size={14} />
          {sending ? t("sending") : t("sendBroadcast")}
        </button>
        {result && <p className="text-xs text-muted">{result}</p>}
      </div>

      {broadcasts.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
            <History size={13} /> {t("broadcastHistory")}
          </h3>
          <ul className="divide-y divide-border rounded-md border border-border bg-surface">
            {broadcasts.map((b) => (
              <li key={b.id} className="px-4 py-2.5">
                <p className="whitespace-pre-wrap text-xs text-ink">{b.message}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {formatDisplayDate(b.created_at.slice(0, 10), locale)} · {t("recipientCount", { count: b.recipient_count })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
