"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Archive, PackagePlus, Trash2, CheckSquare, Square, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type ReceivedTask = Database["public"]["Tables"]["received_tasks"]["Row"];

const NEW_PROJECT = "__new__";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ReceivedTasksBoard({
  initialItems,
  projects,
}: {
  initialItems: ReceivedTask[];
  projects: Project[];
}) {
  const t = useTranslations("inbox");
  const [items, setItems] = useState(initialItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetProject, setTargetProject] = useState(projects[0]?.id ?? NEW_PROJECT);
  const [newProjectName, setNewProjectName] = useState(t("defaultProjectName"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  }

  async function resolveProjectId(userId: string): Promise<string | null> {
    if (targetProject !== NEW_PROJECT) return targetProject;
    const supabase = createClient();
    const { data, error: projErr } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: newProjectName.trim() || t("defaultProjectName"), color: "#3DDBD9" })
      .select("id")
      .single();
    if (projErr || !data) return null;
    setTargetProject(data.id);
    return data.id;
  }

  async function acceptItems(list: ReceivedTask[]) {
    if (list.length === 0) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError(t("mustBeSignedIn"));
      setBusy(false);
      return;
    }

    const projectId = await resolveProjectId(user.id);
    if (!projectId) {
      setError(t("actionError"));
      setBusy(false);
      return;
    }

    const rows = list.map((item) => ({
      user_id: user.id,
      project_id: projectId,
      title: item.title,
      description: item.description,
      link_url: item.link_url,
      extra_links: item.extra_links ?? [],
      category: item.category,
      emoji: item.emoji,
      recurrence_type: item.recurrence_type,
      recurrence_days: item.recurrence_days,
      custom_dates: item.custom_dates,
      start_date: todayISO(),
      priority: item.priority,
      active: true,
      archived: false,
    }));

    const { error: insertError } = await supabase.from("task_templates").insert(rows);
    if (insertError) {
      setError(t("actionError"));
      setBusy(false);
      return;
    }

    const ids = list.map((i) => i.id);
    await supabase.from("received_tasks").delete().in("id", ids);
    setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setBusy(false);
  }

  async function deleteItems(list: ReceivedTask[]) {
    if (list.length === 0) return;
    if (!confirm(t("confirmDelete"))) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const ids = list.map((i) => i.id);
    const { error: deleteError } = await supabase.from("received_tasks").delete().in("id", ids);
    setBusy(false);
    if (deleteError) {
      setError(t("actionError"));
      return;
    }
    setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  const selectedItems = useMemo(() => items.filter((i) => selectedIds.has(i.id)), [items, selectedIds]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
        <Archive size={22} className="text-muted/70" />
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs text-muted">{t("addToProject")}</label>
          <select
            value={targetProject}
            onChange={(e) => setTargetProject(e.target.value)}
            className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value={NEW_PROJECT}>{t("newProjectOption")}</option>
          </select>
        </div>
        {targetProject === NEW_PROJECT && (
          <input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder={t("defaultProjectName")}
            className="w-full min-w-[160px] flex-1 rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
          />
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-ink"
        >
          {allSelected ? <CheckSquare size={14} className="text-teal" /> : <Square size={14} />}
          {t("selectAll")}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <button
                disabled={busy}
                onClick={() => acceptItems(selectedItems)}
                className="flex items-center gap-1.5 rounded-md border border-teal/40 bg-teal/10 px-3 py-1.5 text-xs font-medium text-teal transition hover:bg-teal/20 disabled:opacity-50"
              >
                <PackagePlus size={13} /> {t("acceptSelected", { count: selectedIds.size })}
              </button>
              <button
                disabled={busy}
                onClick={() => deleteItems(selectedItems)}
                className="flex items-center gap-1.5 rounded-md border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/20 disabled:opacity-50"
              >
                <Trash2 size={13} /> {t("deleteSelected", { count: selectedIds.size })}
              </button>
            </>
          )}
          <button
            disabled={busy}
            onClick={() => acceptItems(items)}
            className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold transition hover:bg-gold/20 disabled:opacity-50"
          >
            <PackagePlus size={13} /> {t("acceptAll")}
          </button>
          <button
            disabled={busy}
            onClick={() => deleteItems(items)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted transition hover:border-danger/40 hover:text-danger disabled:opacity-50"
          >
            <Trash2 size={13} /> {t("deleteAll")}
          </button>
        </div>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {items.map((item) => {
          const selected = selectedIds.has(item.id);
          return (
            <li key={item.id} className="flex items-start gap-3 px-4 py-3">
              <button onClick={() => toggleOne(item.id)} className="mt-0.5 shrink-0 text-muted hover:text-teal">
                {selected ? <CheckSquare size={15} className="text-teal" /> : <Square size={15} />}
              </button>
              <span className="mt-0.5 shrink-0 text-lg leading-none">{item.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{item.title}</p>
                {item.description && <p className="truncate text-xs text-muted">{item.description}</p>}
                {item.from_username && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted/80">
                    <User size={10} /> {t("sentBy", { name: item.from_username })}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  disabled={busy}
                  onClick={() => acceptItems([item])}
                  title={t("acceptOne")}
                  className="rounded-md border border-teal/40 bg-teal/10 p-1.5 text-teal transition hover:bg-teal/20 disabled:opacity-50"
                >
                  <PackagePlus size={13} />
                </button>
                <button
                  disabled={busy}
                  onClick={() => deleteItems([item])}
                  title={t("deleteOne")}
                  className="rounded-md border border-border p-1.5 text-muted transition hover:border-danger/40 hover:text-danger disabled:opacity-50"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
