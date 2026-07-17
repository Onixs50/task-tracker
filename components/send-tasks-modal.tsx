"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { X, FolderOpen, Folders, ListChecks, Layers } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];

type Scope = "one_project" | "many_projects" | "everything" | "custom";

export function SendTasksModal({
  projects,
  templates,
  onPickCustom,
  onSend,
  onClose,
}: {
  projects: Project[];
  templates: TaskTemplate[];
  /** Called when the user wants to hand-pick individual tasks — the caller switches to select mode. */
  onPickCustom: () => void;
  onSend: (tasks: TaskTemplate[]) => void;
  onClose: () => void;
}) {
  const t = useTranslations("admin");
  const [scope, setScope] = useState<Scope>("one_project");
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  const [chosenProjectIds, setChosenProjectIds] = useState<Set<string>>(new Set());

  const activeTemplates = useMemo(() => templates.filter((tpl) => !tpl.archived), [templates]);

  function countFor(pid: string) {
    return activeTemplates.filter((tpl) => tpl.project_id === pid).length;
  }

  function toggleProject(pid: string) {
    setChosenProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  }

  function confirm() {
    if (scope === "custom") {
      onPickCustom();
      onClose();
      return;
    }
    if (scope === "everything") {
      onSend(activeTemplates);
      return;
    }
    if (scope === "one_project") {
      onSend(activeTemplates.filter((tpl) => tpl.project_id === projectId));
      return;
    }
    onSend(activeTemplates.filter((tpl) => chosenProjectIds.has(tpl.project_id)));
  }

  const disabled =
    (scope === "one_project" && !projectId) ||
    (scope === "many_projects" && chosenProjectIds.size === 0) ||
    (scope === "everything" && activeTemplates.length === 0);

  const options: { value: Scope; icon: typeof FolderOpen; label: string; hint: string }[] = [
    { value: "one_project", icon: FolderOpen, label: t("sendScopeOneProject"), hint: t("sendScopeOneProjectHint") },
    { value: "many_projects", icon: Folders, label: t("sendScopeManyProjects"), hint: t("sendScopeManyProjectsHint") },
    { value: "everything", icon: Layers, label: t("sendScopeEverything"), hint: t("sendScopeEverythingHint") },
    { value: "custom", icon: ListChecks, label: t("sendScopeCustom"), hint: t("sendScopeCustomHint") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md animate-fade-up space-y-4 rounded-lg border border-border bg-surface p-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">{t("sendTasksTitle")}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            const selected = scope === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setScope(opt.value)}
                className={`flex w-full items-start gap-2.5 rounded-md border px-3 py-2.5 text-start transition ${
                  selected ? "border-gold/50 bg-gold/10" : "border-border hover:border-gold/30"
                }`}
              >
                <Icon size={16} className={selected ? "mt-0.5 shrink-0 text-gold" : "mt-0.5 shrink-0 text-muted"} />
                <span className="min-w-0">
                  <span className={`block text-sm ${selected ? "text-gold" : "text-ink"}`}>{opt.label}</span>
                  <span className="block text-xs text-muted">{opt.hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        {scope === "one_project" && (
          <div>
            <label className="mb-1 block text-xs text-muted">{t("sendPickProject")}</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({countFor(p.id)})
                </option>
              ))}
            </select>
          </div>
        )}

        {scope === "many_projects" && (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-bg p-2">
            {projects.map((p) => (
              <label
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-surface"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={chosenProjectIds.has(p.id)}
                    onChange={() => toggleProject(p.id)}
                    className="accent-gold"
                  />
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="truncate">{p.name}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">{countFor(p.id)}</span>
              </label>
            ))}
          </div>
        )}

        {scope === "everything" && (
          <p className="rounded-md border border-border bg-bg px-3 py-2 text-xs text-muted">
            {t("sendScopeEverythingCount", { count: activeTemplates.length })}
          </p>
        )}

        <button
          onClick={confirm}
          disabled={disabled}
          className="w-full rounded-sm bg-gold/15 py-2.5 text-sm font-medium text-gold hover:bg-gold/25 disabled:opacity-50"
        >
          {scope === "custom" ? t("sendScopeCustomAction") : t("sendContinue")}
        </button>
      </div>
    </div>
  );
}
