"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Quote = Database["public"]["Tables"]["quotes"]["Row"];

export function QuotesManager({ initial }: { initial: Quote[] }) {
  const t = useTranslations("admin");
  const [quotes, setQuotes] = useState(initial);
  const [value, setValue] = useState("");

  async function add() {
    if (!value.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("quotes")
      .insert({ user_id: user.id, text: value.trim() })
      .select()
      .single();
    if (!error && data) {
      setQuotes((prev) => [...prev, data]);
      setValue("");
    }
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("quotes").delete().eq("id", id);
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-5">
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">{t("quotes")}</h2>
        <p className="mt-1 text-xs text-muted">{t("quotesHint")}</p>
      </div>

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={t("newQuote")}
          className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
        />
        <button onClick={add} className="flex shrink-0 items-center gap-1 rounded-sm bg-gold/15 px-3 text-xs text-gold hover:bg-gold/25">
          <Plus size={14} /> {t("addQuote")}
        </button>
      </div>

      {quotes.length === 0 ? (
        <p className="text-xs text-muted">{t("noQuotes")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {quotes.map((q) => (
            <li key={q.id} className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm">{q.text}</span>
              <Trash2 size={13} className="shrink-0 cursor-pointer text-muted hover:text-danger" onClick={() => remove(q.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
