"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Pencil, X, Copy, Archive, ArchiveRestore, Search, ExternalLink, Share2, CheckSquare, Square } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TASK_CATEGORIES, EMOJI_PICKS } from "@/lib/task-categories";
import { ShareModal } from "@/components/share-modal";
import { TaskReminderControl } from "@/components/task-reminder-control";
import type { Database, RecurrenceType, Priority, TaskCategory, SharedTaskPayload } from "@/lib/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];

const SWATCHES = [
  "#E8A33D", "#3DDBD9", "#E8543D", "#8B92A5", "#6C8EEF",
  "#B279E8", "#5FCB6C", "#F06FA6", "#F2C94C", "#4FB3E8",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Ensures a link the user typed (e.g. "google.com") has a protocol so it opens correctly. */
function normalizeUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

const emptyForm = () => ({
  title: "",
  description: "",
  link_url: "",
  category: "custom" as TaskCategory,
  emoji: "✅",
  recurrence_type: "daily" as RecurrenceType,
  recurrence_days: [] as number[],
  custom_dates: [] as string[],
  start_date: todayISO(),
  end_date: "",
  priority: "medium" as Priority,
});

export function AdminBoard({
  initialProjects,
  initialTemplates,
  locale,
  timezone,
}: {
  initialProjects: Project[];
  initialTemplates: TaskTemplate[];
  locale: string;
  timezone: string;
}) {
  const t = useTranslations("admin");
  const tRec = useTranslations("recurrence");
  const tPri = useTranslations("priority");
  const tDays = useTranslations("days");
  const tCategory = useTranslations("category");

  const [projects, setProjects] = useState(initialProjects);
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(initialProjects[0]?.id ?? null);

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState(SWATCHES[0]);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTemplate | null>(null);
  const [form, setForm] = useState(emptyForm());

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [showArchived, setShowArchived] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shareTasks, setShareTasks] = useState<SharedTaskPayload[] | null>(null);

  function toSharedPayload(tpl: TaskTemplate): SharedTaskPayload {
    return {
      title: tpl.title,
      description: tpl.description,
      link_url: tpl.link_url,
      category: tpl.category,
      emoji: tpl.emoji,
      recurrence_type: tpl.recurrence_type,
      recurrence_days: tpl.recurrence_days,
      custom_dates: tpl.custom_dates,
      priority: tpl.priority,
    };
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function shareSingle(tpl: TaskTemplate) {
    setShareTasks([toSharedPayload(tpl)]);
  }

  function shareSelected() {
    const chosen = templates.filter((tpl) => selectedIds.has(tpl.id));
    if (chosen.length === 0) return;
    setShareTasks(chosen.map(toSharedPayload));
  }

  function resetTaskForm() {
    setForm(emptyForm());
    setEditingTask(null);
  }

  async function addProject() {
    if (!projectName.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: user.id, name: projectName.trim(), color: projectColor })
      .select()
      .single();
    if (!error && data) {
      setProjects((prev) => [...prev, data]);
      setActiveProjectId(data.id);
      setProjectName("");
      setShowProjectForm(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const supabase = createClient();
    await supabase.from("projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTemplates((prev) => prev.filter((tpl) => tpl.project_id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  }

  async function saveTask() {
    if (!form.title.trim() || !activeProjectId) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      project_id: activeProjectId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      link_url: normalizeUrl(form.link_url) || null,
      category: form.category,
      emoji: form.emoji,
      recurrence_type: form.recurrence_type,
      recurrence_days: form.recurrence_type === "weekly" ? form.recurrence_days : null,
      custom_dates: form.recurrence_type === "custom_dates" ? form.custom_dates : null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      priority: form.priority,
      active: true,
      archived: false,
    };

    if (editingTask) {
      const { data, error } = await supabase
        .from("task_templates")
        .update(payload)
        .eq("id", editingTask.id)
        .select()
        .single();
      if (!error && data) setTemplates((prev) => prev.map((tpl) => (tpl.id === data.id ? data : tpl)));
    } else {
      const { data, error } = await supabase.from("task_templates").insert(payload).select().single();
      if (!error && data) setTemplates((prev) => [...prev, data]);
    }

    resetTaskForm();
    setShowTaskForm(false);
  }

  async function deleteTask(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const supabase = createClient();
    await supabase.from("task_templates").delete().eq("id", id);
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
  }

  async function toggleArchive(tpl: TaskTemplate) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("task_templates")
      .update({ archived: !tpl.archived })
      .eq("id", tpl.id)
      .select()
      .single();
    if (!error && data) setTemplates((prev) => prev.map((x) => (x.id === data.id ? data : x)));
  }

  async function duplicateTask(tpl: TaskTemplate) {
    const supabase = createClient();
    const { id, created_at, ...rest } = tpl;
    const { data, error } = await supabase
      .from("task_templates")
      .insert({ ...rest, title: `${tpl.title} (copy)` })
      .select()
      .single();
    if (!error && data) setTemplates((prev) => [...prev, data]);
  }

  function startEdit(tpl: TaskTemplate) {
    setEditingTask(tpl);
    setForm({
      title: tpl.title,
      description: tpl.description ?? "",
      link_url: tpl.link_url ?? "",
      category: tpl.category,
      emoji: tpl.emoji,
      recurrence_type: tpl.recurrence_type,
      recurrence_days: tpl.recurrence_days ?? [],
      custom_dates: tpl.custom_dates ?? [],
      start_date: tpl.start_date,
      end_date: tpl.end_date ?? "",
      priority: tpl.priority,
    });
    setShowTaskForm(true);
  }

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const visibleTasks = useMemo(() => {
    return templates
      .filter((tpl) => tpl.project_id === activeProjectId)
      .filter((tpl) => (showArchived ? true : !tpl.archived))
      .filter((tpl) => (priorityFilter === "all" ? true : tpl.priority === priorityFilter))
      .filter((tpl) => tpl.title.toLowerCase().includes(search.toLowerCase()));
  }, [templates, activeProjectId, showArchived, priorityFilter, search]);

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* Projects column */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">{t("projects")}</h2>
          <button onClick={() => setShowProjectForm((v) => !v)} className="text-muted hover:text-gold">
            <Plus size={16} />
          </button>
        </div>

        {showProjectForm && (
          <div className="space-y-2 rounded-md border border-border bg-surface p-3">
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t("projectName")}
              className="w-full rounded-sm border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-gold/60"
            />
            <div className="flex flex-wrap gap-1.5">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => setProjectColor(c)}
                  className="h-5 w-5 rounded-full transition"
                  style={{
                    backgroundColor: c,
                    boxShadow: projectColor === c ? `0 0 0 2px rgb(var(--bg)), 0 0 0 4px ${c}` : "none",
                  }}
                />
              ))}
            </div>
            <button onClick={addProject} className="w-full rounded-sm bg-gold/15 py-1.5 text-xs text-gold hover:bg-gold/25">
              {t("save")}
            </button>
          </div>
        )}

        <ul className="space-y-1">
          {projects.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => setActiveProjectId(p.id)}
                className={`group flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm transition ${
                  activeProjectId === p.id ? "bg-surface text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="truncate">{p.name}</span>
                </span>
                <Trash2
                  size={13}
                  className="shrink-0 opacity-0 transition hover:text-danger group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(p.id);
                  }}
                />
              </button>
            </li>
          ))}
          {projects.length === 0 && <p className="px-1 text-xs text-muted">{t("noProjects")}</p>}
        </ul>
      </div>

      {/* Tasks column */}
      <div className="space-y-3">
        {activeProject ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm font-medium">{activeProject.name} — {t("tasks")}</h2>
              <button
                onClick={() => {
                  resetTaskForm();
                  setShowTaskForm((v) => !v);
                }}
                className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-muted hover:text-gold"
              >
                <Plus size={13} /> {t("newTask")}
              </button>
            </div>

            {/* filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-[160px] flex-1 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5">
                <Search size={13} className="text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("search")}
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}
                className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-muted outline-none"
              >
                <option value="all">{t("filterAll")}</option>
                <option value="high">{tPri("high")}</option>
                <option value="medium">{tPri("medium")}</option>
                <option value="low">{tPri("low")}</option>
              </select>
              <button
                onClick={() => setShowArchived((v) => !v)}
                className={`rounded-md border px-2.5 py-1.5 text-xs transition ${
                  showArchived ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted"
                }`}
              >
                {t("showArchived")}
              </button>
              <button
                onClick={() => {
                  setSelectMode((v) => !v);
                  setSelectedIds(new Set());
                }}
                className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs transition ${
                  selectMode ? "border-teal/50 bg-teal/15 text-teal" : "border-border text-muted"
                }`}
              >
                {selectMode ? <CheckSquare size={13} /> : <Square size={13} />}
                {t("selectToShare")}
              </button>
              {selectMode && selectedIds.size > 0 && (
                <button
                  onClick={shareSelected}
                  className="flex items-center gap-1 rounded-md border border-gold/50 bg-gold/15 px-2.5 py-1.5 text-xs text-gold hover:bg-gold/25"
                >
                  <Share2 size={13} /> {t("shareSelected", { count: selectedIds.size })}
                </button>
              )}
            </div>

            {showTaskForm && (
              <div className="space-y-3 rounded-md border border-border bg-surface p-4 animate-fade-up">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">
                    {editingTask ? t("editTask") : t("newTask")}
                  </span>
                  <button onClick={() => setShowTaskForm(false)} className="text-muted hover:text-ink">
                    <X size={14} />
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border bg-bg text-lg">
                    {form.emoji}
                  </div>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={t("taskTitle")}
                    className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_PICKS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setForm({ ...form, emoji: e })}
                      className={`flex h-7 w-7 items-center justify-center rounded-sm text-sm transition ${
                        form.emoji === e ? "bg-gold/20 ring-1 ring-gold/50" : "hover:bg-bg"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>

                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t("taskDescription")}
                  rows={2}
                  className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
                />

                <div>
                  <label className="mb-1 block text-xs text-muted">{t("taskLink")}</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={form.link_url}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                    placeholder={t("taskLinkPlaceholder")}
                    className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted">{t("category")}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TASK_CATEGORIES.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setForm({ ...form, category: c.key, emoji: form.emoji === "✅" ? c.emoji : form.emoji })}
                        className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${
                          form.category === c.key
                            ? "border-gold/50 bg-gold/15 text-gold"
                            : "border-border text-muted hover:text-ink"
                        }`}
                      >
                        <span>{c.emoji}</span>
                        {tCategory(c.key)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted">{t("recurrenceType")}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(["daily", "weekly", "custom_dates", "once"] as RecurrenceType[]).map((rt) => (
                      <button
                        key={rt}
                        onClick={() => setForm({ ...form, recurrence_type: rt })}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          form.recurrence_type === rt
                            ? "border-gold/50 bg-gold/15 text-gold"
                            : "border-border text-muted hover:text-ink"
                        }`}
                      >
                        {tRec(rt)}
                      </button>
                    ))}
                  </div>
                </div>

                {form.recurrence_type === "weekly" && (
                  <div>
                    <label className="mb-1 block text-xs text-muted">{t("weekDays")}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                        <button
                          key={d}
                          onClick={() =>
                            setForm({
                              ...form,
                              recurrence_days: form.recurrence_days.includes(d)
                                ? form.recurrence_days.filter((x) => x !== d)
                                : [...form.recurrence_days, d],
                            })
                          }
                          className={`h-8 w-8 rounded-full border text-xs transition ${
                            form.recurrence_days.includes(d)
                              ? "border-teal/50 bg-teal/15 text-teal"
                              : "border-border text-muted hover:text-ink"
                          }`}
                        >
                          {tDays(String(d))}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.recurrence_type === "custom_dates" && (
                  <div>
                    <label className="mb-1 block text-xs text-muted">{t("customDates")}</label>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {form.custom_dates.map((d) => (
                        <span
                          key={d}
                          className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted"
                        >
                          {d}
                          <X
                            size={11}
                            className="cursor-pointer hover:text-danger"
                            onClick={() =>
                              setForm({ ...form, custom_dates: form.custom_dates.filter((x) => x !== d) })
                            }
                          />
                        </span>
                      ))}
                    </div>
                    <input
                      type="date"
                      onChange={(e) => {
                        if (e.target.value && !form.custom_dates.includes(e.target.value)) {
                          setForm({ ...form, custom_dates: [...form.custom_dates, e.target.value] });
                        }
                        e.target.value = "";
                      }}
                      className="rounded-sm border border-border bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-gold/60"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted">{t("startDate")}</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full rounded-sm border border-border bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-gold/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">{t("endDate")}</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full rounded-sm border border-border bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-gold/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted">{t("priority")}</label>
                  <div className="flex gap-1.5">
                    {(["low", "medium", "high"] as Priority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setForm({ ...form, priority: p })}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          form.priority === p
                            ? "border-gold/50 bg-gold/15 text-gold"
                            : "border-border text-muted hover:text-ink"
                        }`}
                      >
                        {tPri(p)}
                      </button>
                    ))}
                  </div>
                </div>

                {editingTask && <TaskReminderControl templateId={editingTask.id} timezone={timezone} />}

                <button onClick={saveTask} className="w-full rounded-sm bg-gold/15 py-2 text-sm text-gold hover:bg-gold/25">
                  {t("save")}
                </button>
              </div>
            )}

            <ul className="divide-y divide-border rounded-md border border-border bg-surface">
              {visibleTasks.map((tpl) => (
                <li key={tpl.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${tpl.archived ? "opacity-50" : ""}`}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    {selectMode && (
                      <button onClick={() => toggleSelected(tpl.id)} className="shrink-0 text-muted hover:text-teal">
                        {selectedIds.has(tpl.id) ? (
                          <CheckSquare size={15} className="text-teal" />
                        ) : (
                          <Square size={15} />
                        )}
                      </button>
                    )}
                    <span className="text-lg leading-none">{tpl.emoji}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm">{tpl.title}</p>
                      <p className="text-xs text-muted">
                        {tCategory(tpl.category)} · {tRec(tpl.recurrence_type)} · {tPri(tpl.priority)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2 text-muted">
                    {tpl.link_url && (
                      <a
                        href={tpl.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-teal"
                        title={tpl.link_url}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <Share2 size={14} className="cursor-pointer hover:text-gold" onClick={() => shareSingle(tpl)} />
                    <Copy size={14} className="cursor-pointer hover:text-gold" onClick={() => duplicateTask(tpl)} />
                    {tpl.archived ? (
                      <ArchiveRestore size={14} className="cursor-pointer hover:text-teal" onClick={() => toggleArchive(tpl)} />
                    ) : (
                      <Archive size={14} className="cursor-pointer hover:text-gold" onClick={() => toggleArchive(tpl)} />
                    )}
                    <Pencil size={14} className="cursor-pointer hover:text-gold" onClick={() => startEdit(tpl)} />
                    <Trash2 size={14} className="cursor-pointer hover:text-danger" onClick={() => deleteTask(tpl.id)} />
                  </div>
                </li>
              ))}
              {visibleTasks.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-muted">{t("noTasks")}</li>
              )}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted">{t("noProjects")}</p>
        )}
      </div>

      {shareTasks && (
        <ShareModal tasks={shareTasks} locale={locale} onClose={() => setShareTasks(null)} />
      )}
    </div>
  );
}
