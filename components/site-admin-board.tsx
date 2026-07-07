"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Pencil, X, Megaphone, CheckCircle2, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MascotBoy } from "@/components/mascot-boy";
import type { Database } from "@/lib/supabase/types";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

export function SiteAdminBoard({ initialAnnouncements }: { initialAnnouncements: Announcement[] }) {
  const t = useTranslations("siteAdmin");
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  function resetForm() {
    setEditing(null);
    setTitle("");
    setMessage("");
    setShowForm(false);
  }

  function startEdit(a: Announcement) {
    setEditing(a);
    setTitle(a.title ?? "");
    setMessage(a.message);
    setShowForm(true);
  }

  async function save() {
    if (!message.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (editing) {
      const { data, error } = await supabase
        .from("announcements")
        .update({ title: title.trim() || null, message: message.trim() })
        .eq("id", editing.id)
        .select()
        .single();
      if (!error && data) setAnnouncements((prev) => prev.map((a) => (a.id === data.id ? data : a)));
    } else {
      const { data, error } = await supabase
        .from("announcements")
        .insert({ title: title.trim() || null, message: message.trim(), created_by: user.id, active: true })
        .select()
        .single();
      if (!error && data) setAnnouncements((prev) => [data, ...prev]);
    }
    resetForm();
  }

  async function toggleActive(a: Announcement) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("announcements")
      .update({ active: !a.active })
      .eq("id", a.id)
      .select()
      .single();
    if (!error && data) setAnnouncements((prev) => prev.map((x) => (x.id === data.id ? data : x)));
  }

  async function remove(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const supabase = createClient();
    await supabase.from("announcements").delete().eq("id", id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-surface p-4">
        <MascotBoy size="sm" message={t("previewHint")} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">{t("announcements")}</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm((v) => !v);
          }}
          className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-muted hover:text-gold"
        >
          <Plus size={13} /> {t("newAnnouncement")}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-md border border-border bg-surface p-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">
              {editing ? t("editAnnouncement") : t("newAnnouncement")}
            </span>
            <button onClick={resetForm} className="text-muted hover:text-ink">
              <X size={14} />
            </button>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("announcementTitle")}
            className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("announcementMessage")}
            rows={3}
            className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
          />
          <button onClick={save} className="w-full rounded-sm bg-gold/15 py-2 text-sm text-gold hover:bg-gold/25">
            {t("save")}
          </button>
        </div>
      )}

      <ul className="divide-y divide-border rounded-md border border-border bg-surface">
        {announcements.map((a) => (
          <li key={a.id} className={`flex items-start justify-between gap-3 px-4 py-3 ${!a.active ? "opacity-50" : ""}`}>
            <div className="flex min-w-0 items-start gap-2.5">
              <Megaphone size={16} className="mt-0.5 shrink-0 text-gold" />
              <div className="min-w-0">
                {a.title && <p className="truncate text-sm font-medium">{a.title}</p>}
                <p className="whitespace-pre-wrap text-xs text-muted">{a.message}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5 text-muted">
              <button onClick={() => toggleActive(a)} title={t("toggleActive")} className="hover:text-teal">
                {a.active ? <CheckCircle2 size={15} className="text-teal" /> : <Circle size={15} />}
              </button>
              <Pencil size={14} className="cursor-pointer hover:text-gold" onClick={() => startEdit(a)} />
              <Trash2 size={14} className="cursor-pointer hover:text-danger" onClick={() => remove(a.id)} />
            </div>
          </li>
        ))}
        {announcements.length === 0 && (
          <li className="px-4 py-6 text-center text-xs text-muted">{t("noAnnouncements")}</li>
        )}
      </ul>
    </div>
  );
}
