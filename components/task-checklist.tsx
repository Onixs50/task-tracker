"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Undo2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];
type TaskLog = Database["public"]["Tables"]["task_logs"]["Row"];

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-danger",
  medium: "bg-gold",
  low: "bg-muted",
};

export function TaskChecklist({
  projects,
  templates,
  logs,
  todayISO,
  locale,
}: {
  projects: Project[];
  templates: TaskTemplate[];
  logs: TaskLog[];
  todayISO: string;
  locale: string;
}) {
  const t = useTranslations("dashboard");
  const tCategory = useTranslations("category");
  const [logMap, setLogMap] = useState<Record<string, TaskLog>>(() => {
    const map: Record<string, TaskLog> = {};
    for (const log of logs) map[log.task_template_id] = log;
    return map;
  });
  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());

  async function persist(template: TaskTemplate, done: boolean) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("task_logs").upsert(
      {
        user_id: user.id,
        task_template_id: template.id,
        log_date: todayISO,
        status: done ? "done" : "pending",
        completed_at: done ? new Date().toISOString() : null,
      },
      { onConflict: "task_template_id,log_date" }
    );
  }

  function markDone(template: TaskTemplate) {
    setAnimatingOut((prev) => new Set(prev).add(template.id));
    persist(template, true);
  }

  function undo(template: TaskTemplate) {
    setLogMap((prev) => ({
      ...prev,
      [template.id]: { ...prev[template.id], status: "pending", completed_at: null },
    }));
    setAnimatingOut((prev) => {
      const next = new Set(prev);
      next.delete(template.id);
      return next;
    });
    persist(template, false);
  }

  function onAnimationEnd(template: TaskTemplate) {
    setLogMap((prev) => ({
      ...prev,
      [template.id]: {
        id: prev[template.id]?.id ?? "temp",
        user_id: prev[template.id]?.user_id ?? "",
        task_template_id: template.id,
        log_date: todayISO,
        status: "done",
        completed_at: new Date().toISOString(),
      },
    }));
    setAnimatingOut((prev) => {
      const next = new Set(prev);
      next.delete(template.id);
      return next;
    });
  }

  const grouped = useMemo(() => {
    const byProject = new Map<string, TaskTemplate[]>();
    for (const tpl of templates) {
      if (logMap[tpl.id]?.status === "done" && !animatingOut.has(tpl.id)) continue;
      const list = byProject.get(tpl.project_id) ?? [];
      list.push(tpl);
      byProject.set(tpl.project_id, list);
    }
    return byProject;
  }, [templates, logMap, animatingOut]);

  const doneToday = templates.filter((tpl) => logMap[tpl.id]?.status === "done" && !animatingOut.has(tpl.id));

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
        {t("empty")}
      </div>
    );
  }

  const allDone = templates.every((tpl) => logMap[tpl.id]?.status === "done");

  return (
    <div className="space-y-5">
      {allDone && (
        <div className="rounded-md border border-teal/30 bg-teal/10 px-4 py-2.5 text-sm text-teal animate-fade-up">
          {t("allDone")}
        </div>
      )}

      {Array.from(grouped.entries()).map(([projectId, tasks]) => {
        const project = projects.find((p) => p.id === projectId);
        if (tasks.length === 0) return null;
        return (
          <div key={projectId} className="rounded-lg border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project?.color ?? "#8B92A5" }} />
              <span className="font-display text-sm font-medium">{project?.name ?? "—"}</span>
            </div>
            <ul>
              {tasks.map((tpl) => {
                const isAnimating = animatingOut.has(tpl.id);
                return (
                  <li
                    key={tpl.id}
                    onAnimationEnd={() => isAnimating && onAnimationEnd(tpl)}
                    className={`flex items-center justify-between gap-3 overflow-hidden border-b border-border px-4 py-3 last:border-b-0 ${
                      isAnimating ? "animate-fade-out-collapse" : "animate-fade-up"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-lg leading-none">{tpl.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[tpl.priority]}`} />
                          <p className="truncate text-sm text-ink">{tpl.title}</p>
                        </div>
                        <p className="truncate text-xs text-muted">{tCategory(tpl.category)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => markDone(tpl)}
                      className="flex shrink-0 items-center gap-1.5 rounded-md border border-teal/40 bg-teal/10 px-3 py-1.5 text-xs font-medium text-teal transition hover:bg-teal/20"
                    >
                      <Check size={13} />
                      {t("markDone")}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {doneToday.length > 0 && (
        <div className="rounded-lg border border-border bg-surface/50">
          <div className="border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
            {t("doneToday")} · {doneToday.length}
          </div>
          <ul>
            {doneToday.map((tpl) => (
              <li
                key={tpl.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm text-muted line-through">
                  <span className="text-base leading-none opacity-60">{tpl.emoji}</span>
                  <span className="truncate">{tpl.title}</span>
                </span>
                <button onClick={() => undo(tpl)} className="shrink-0 text-muted hover:text-danger">
                  <Undo2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
