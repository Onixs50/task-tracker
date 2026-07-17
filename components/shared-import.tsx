"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, PackagePlus, Inbox } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MascotBoy } from "@/components/mascot-boy";
import type { SharedTaskPayload } from "@/lib/supabase/types";

const NEW_PROJECT = "__new__";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type Mode = "direct" | "inbox";

export function SharedImport({
  tasks,
  projects,
  isLoggedIn,
  locale,
  bundleId,
  fromUsername,
}: {
  tasks: SharedTaskPayload[];
  projects: { id: string; name: string; color: string }[];
  isLoggedIn: boolean;
  locale: string;
  bundleId: string;
  fromUsername?: string | null;
}) {
  const t = useTranslations("share");
  const [mode, setMode] = useState<Mode>("direct");
  const [targetProject, setTargetProject] = useState(projects[0]?.id ?? NEW_PROJECT);
  const [newProjectName, setNewProjectName] = useState(t("sharedProjectName"));
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function importTasks() {
    if (tasks.length === 0) return;
    setImporting(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError(t("mustBeSignedIn"));
      setImporting(false);
      return;
    }

    let projectId = targetProject;
    if (projectId === NEW_PROJECT) {
      const { data, error: projErr } = await supabase
        .from("projects")
        .insert({ user_id: user.id, name: newProjectName.trim() || t("sharedProjectName"), color: "#3DDBD9" })
        .select("id")
        .single();
      if (projErr || !data) {
        setError(t("importError"));
        setImporting(false);
        return;
      }
      projectId = data.id;
    }

    const rows = tasks.map((tpl) => ({
      user_id: user.id,
      project_id: projectId,
      title: tpl.title,
      description: tpl.description,
      link_url: tpl.link_url,
      extra_links: tpl.extra_links ?? [],
      category: tpl.category,
      emoji: tpl.emoji,
      recurrence_type: tpl.recurrence_type,
      recurrence_days: tpl.recurrence_days,
      custom_dates: tpl.custom_dates,
      start_date: todayISO(),
      priority: tpl.priority,
      active: true,
      archived: false,
    }));

    const { error: insertError } = await supabase.from("task_templates").insert(rows);
    setImporting(false);
    if (insertError) {
      setError(t("importError"));
      return;
    }
    setDone(true);
  }

  async function saveToInbox() {
    if (tasks.length === 0) return;
    setImporting(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError(t("mustBeSignedIn"));
      setImporting(false);
      return;
    }

    const rows = tasks.map((tpl) => ({
      recipient_id: user.id,
      from_username: fromUsername || null,
      bundle_id: bundleId,
      title: tpl.title,
      description: tpl.description,
      link_url: tpl.link_url,
      extra_links: tpl.extra_links ?? [],
      category: tpl.category,
      emoji: tpl.emoji,
      recurrence_type: tpl.recurrence_type,
      recurrence_days: tpl.recurrence_days,
      custom_dates: tpl.custom_dates,
      priority: tpl.priority,
    }));

    const { error: insertError } = await supabase.from("received_tasks").insert(rows);
    setImporting(false);
    if (insertError) {
      setError(t("importError"));
      return;
    }
    setDone(true);
  }

  const introKey = fromUsername ? "sharedIntroFrom" : "sharedIntro";

  return (
    <div className="w-full max-w-md animate-fade-up space-y-5 rounded-lg border border-border bg-surface p-6">
      <MascotBoy size="sm" message={t(introKey, { count: tasks.length, name: fromUsername ?? "" })} />

      <ul className="divide-y divide-border rounded-md border border-border bg-bg">
        {tasks.map((tpl, i) => (
          <li key={i} className="flex items-start gap-2.5 px-3 py-2.5">
            <span className="text-lg leading-none">{tpl.emoji}</span>
            <div className="min-w-0">
              <p className="truncate text-sm">{tpl.title}</p>
              {tpl.description && <p className="truncate text-xs text-muted">{tpl.description}</p>}
            </div>
          </li>
        ))}
        {tasks.length === 0 && <li className="px-3 py-4 text-center text-xs text-muted">{t("notFound")}</li>}
      </ul>

      {done ? (
        <div className="flex items-center gap-2 rounded-md border border-teal/30 bg-teal/10 px-3 py-2.5 text-sm text-teal">
          <CheckCircle2 size={16} />
          {mode === "inbox" ? t("inboxSaveSuccess") : t("importSuccess")}
        </div>
      ) : isLoggedIn ? (
        tasks.length > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-bg p-1">
              <button
                onClick={() => setMode("direct")}
                className={`rounded-sm py-1.5 text-xs transition ${
                  mode === "direct" ? "bg-gold/15 text-gold" : "text-muted hover:text-ink"
                }`}
              >
                {t("modeDirect")}
              </button>
              <button
                onClick={() => setMode("inbox")}
                className={`rounded-sm py-1.5 text-xs transition ${
                  mode === "inbox" ? "bg-gold/15 text-gold" : "text-muted hover:text-ink"
                }`}
              >
                {t("modeInbox")}
              </button>
            </div>

            {mode === "direct" ? (
              <>
                <div>
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
                    placeholder={t("sharedProjectName")}
                    className="w-full rounded-sm border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-gold/60"
                  />
                )}
                {error && <p className="text-xs text-danger">{error}</p>}
                <button
                  onClick={importTasks}
                  disabled={importing}
                  className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-gold/15 py-2.5 text-sm font-medium text-gold hover:bg-gold/25 disabled:opacity-50"
                >
                  <PackagePlus size={15} />
                  {importing ? t("importing") : t("addToMyList")}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted">{t("modeInboxHint")}</p>
                {error && <p className="text-xs text-danger">{error}</p>}
                <button
                  onClick={saveToInbox}
                  disabled={importing}
                  className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-gold/15 py-2.5 text-sm font-medium text-gold hover:bg-gold/25 disabled:opacity-50"
                >
                  <Inbox size={15} />
                  {importing ? t("importing") : t("saveToInbox")}
                </button>
              </>
            )}
          </div>
        )
      ) : (
        tasks.length > 0 && (
          <Link
            href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/shared/${bundleId}`)}`}
            className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-gold/15 py-2.5 text-sm font-medium text-gold hover:bg-gold/25"
          >
            {t("signInToAdd")}
          </Link>
        )
      )}
    </div>
  );
}
