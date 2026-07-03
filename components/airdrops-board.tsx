"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AirdropStatus, Database } from "@/lib/supabase/types";

type Airdrop = Database["public"]["Tables"]["airdrops"]["Row"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_CLASS: Record<AirdropStatus, string> = {
  claimed: "border-teal/40 bg-teal/10 text-teal",
  pending: "border-gold/40 bg-gold/10 text-gold",
  missed: "border-danger/40 bg-danger/10 text-danger",
};

export function AirdropsBoard({ initial }: { initial: Airdrop[] }) {
  const t = useTranslations("airdrops");
  const [items, setItems] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    project_name: "",
    claim_date: todayISO(),
    value_text: "",
    status: "claimed" as AirdropStatus,
    notes: "",
  });

  async function save() {
    if (!form.project_name.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("airdrops")
      .insert({
        user_id: user.id,
        project_name: form.project_name.trim(),
        claim_date: form.claim_date,
        value_text: form.value_text.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
      })
      .select()
      .single();
    if (!error && data) {
      setItems((prev) => [data, ...prev]);
      setForm({ project_name: "", claim_date: todayISO(), value_text: "", status: "claimed", notes: "" });
      setShowForm(false);
    }
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("airdrops").delete().eq("id", id);
    setItems((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:text-gold"
        >
          <Plus size={14} /> {t("add")}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-md border border-border bg-surface p-4 animate-fade-up">
          <input
            value={form.project_name}
            onChange={(e) => setForm({ ...form, project_name: e.target.value })}
            placeholder={t("projectName")}
            className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={form.claim_date}
              onChange={(e) => setForm({ ...form, claim_date: e.target.value })}
              className="rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
            />
            <input
              value={form.value_text}
              onChange={(e) => setForm({ ...form, value_text: e.target.value })}
              placeholder={t("value")}
              className="rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
            />
          </div>
          <div className="flex gap-1.5">
            {(["claimed", "pending", "missed"] as AirdropStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setForm({ ...form, status: s })}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  form.status === s ? STATUS_CLASS[s] : "border-border text-muted"
                }`}
              >
                {t(`status${s.charAt(0).toUpperCase()}${s.slice(1)}` as any)}
              </button>
            ))}
          </div>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder={t("notes")}
            rows={2}
            className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
          />
          <button onClick={save} className="w-full rounded-sm bg-gold/15 py-2 text-sm text-gold hover:bg-gold/25">
            {t("save")}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
          <Gift size={22} className="mx-auto mb-2 text-muted" />
          {t("empty")}
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm">{a.project_name}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] ${STATUS_CLASS[a.status]}`}>
                    {t(`status${a.status.charAt(0).toUpperCase()}${a.status.slice(1)}` as any)}
                  </span>
                </div>
                <p className="truncate text-xs text-muted">
                  {a.claim_date}
                  {a.value_text ? ` · ${a.value_text}` : ""}
                  {a.notes ? ` · ${a.notes}` : ""}
                </p>
              </div>
              <Trash2 size={14} className="shrink-0 cursor-pointer text-muted hover:text-danger" onClick={() => remove(a.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
